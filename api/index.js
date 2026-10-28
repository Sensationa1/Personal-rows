'use strict';
// Stremio catalog add-on intended for Xperience Step 2 "Import from another add-on".
// All discovery rows are restricted to the matching streaming service's watch-provider.
const DATA = require('../catalogs.json');
const catalogById = new Map(DATA.rows.map(r=>[r.id,r]));
const responseCache = new Map();
const inflight = new Map();
const MEMORY_TTL_MS = 6*60*60*1000;
const PROVIDER_TTL_MS = 24*60*60*1000;

function json(res,code,data){
 res.statusCode=code;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Cache-Control', code===200 ? 'public, max-age=300, s-maxage=10800, stale-while-revalidate=3600' : 'no-store');
 res.end(JSON.stringify(data));
}
function apiAuth(){
 const key=(process.env.TMDB_API_KEY||process.env.TMDB_READ_ACCESS_TOKEN||'').trim();
 if(!key)throw new Error('TMDB_API_KEY not configured on deployment');
 return key;
}
async function tmdb(path,params={}){
 const token=apiAuth();
 const uri = new URL(`https://api.themoviedb.org/3/${path}`);
 for(const [k,v] of Object.entries(params))if(v!==undefined && v!==null && v!=='') uri.searchParams.set(k,String(v));
 const bearer=token.startsWith('eyJ');
 if(!bearer)uri.searchParams.set('api_key',token);
 const controller = new AbortController();
 const timeout=setTimeout(()=>controller.abort(),9000);
 try{
  const r=await fetch(uri,{headers:bearer?{Authorization:`Bearer ${token}`,Accept:'application/json'}:{Accept:'application/json'},signal:controller.signal});
  if(!r.ok)throw new Error(`TMDB ${r.status} from ${path}`);
  return await r.json();
 }finally{clearTimeout(timeout);}
}
function cacheGet(key){const x=responseCache.get(key);return x&&x.exp>Date.now()?x.value:null;}
function cachePut(key,value,ttl){if(responseCache.size>160)responseCache.delete(responseCache.keys().next().value);responseCache.set(key,{value,exp:Date.now()+ttl});return value;}
async function cached(key,ttl,fn){
 const hit=cacheGet(key);if(hit!==null)return hit;
 if(inflight.has(key))return inflight.get(key);
 const p=Promise.resolve().then(fn).then(value=>cachePut(key,value,ttl)).finally(()=>inflight.delete(key));
 inflight.set(key,p);return p;
}
function regionFor(service){
 const key={'Netflix':'NETFLIX','Apple TV+':'APPLE','Prime Video':'PRIME','HBO Max':'HBO','Hulu':'HULU','Disney+':'DISNEY','BritBox':'BRITBOX','Paramount+':'PARAMOUNT'}[service];
 const candidate=String(process.env[`PLATFORM_REGION_${key}`] || DATA.services[service].region).toUpperCase();
 return /^[A-Z]{2}$/.test(candidate)?candidate:DATA.services[service].region;
}
async function providerIds(service,type){
 const conf=DATA.services[service],region=regionFor(service),platformType=type==='series'?'tv':'movie';
 return cached(`providers:${service}:${region}:${platformType}`,PROVIDER_TTL_MS,async()=>{
   const list=await tmdb(`watch/providers/${platformType}`,{watch_region:region,language:'en-US'});
   const regexes=conf.providerPatterns.map(x=>new RegExp(x,'i'));
   const ids=(list.results||[]).filter(r=>regexes.some(re=>re.test(r.provider_name||''))).map(r=>Number(r.provider_id)).filter(Number.isInteger);
   // IDs must correspond to the selected service. No unrestricted fallback to generic titles.
   // Where the API temporarily lacks a matching provider, use only recognized known IDs.
   if(ids.length)return [...new Set(ids)];
   return [...conf.fallback];
 });
}
function createManifest(){
 return {
  id:DATA.id,version:DATA.version,name:DATA.name,description:DATA.description,
  resources:['catalog'],types:['movie','series'],idPrefixes:['tmdb:'],
  catalogs:DATA.rows.map(row=>({type:row.type,id:row.id,name:row.name,extra:[{name:'skip',isRequired:false}]})),
  behaviorHints:{configurable:false,configurationRequired:false}
 };
}
function chooseFilters(row){
 const q={};
 if(row.filter==='genre')q.with_genres=row.value;
 if(row.filter==='language')q.with_original_language=row.value;
 if(row.filter==='toprated' || row.filter==='toprated_genre') {q['vote_count.gte']='80';q.sort_by='vote_average.desc';}
 if(row.filter==='toprated_genre')q.with_genres=row.value;
 return q;
}
function mapMeta(item,type){
 const isTv=type==='series';
 const id=Number(item?.id);
 if(!Number.isInteger(id) || id<=0)return null;
 const name=(isTv?item.name:item.title)||item.name||item.title||'Untitled';
 return {
   id:`tmdb:${id}`,type,name,
   poster:item.poster_path?`https://image.tmdb.org/t/p/w780${item.poster_path}`:undefined,
   background:item.backdrop_path?`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`:undefined,
   posterShape:'poster',description:item.overview||'',
   releaseInfo:String((isTv?item.first_air_date:item.release_date)||'').slice(0,10),
   imdbRating:undefined
 };
}
async function buildCatalog(row,skip){
 const region=regionFor(row.service),provider=await providerIds(row.service,row.type),isTv=row.type==='series';
 const page=Math.floor(skip/20)+1;
 if(!provider.length || page>500)return {metas:[]};
 const q={language:process.env.TMDB_LANGUAGE||'en-US',include_adult:'false',page,
   with_watch_providers:provider.join('|'),watch_region:region,with_watch_monetization_types:'flatrate',
   sort_by:'popularity.desc', ...chooseFilters(row)};
 const today=new Date().toISOString().slice(0,10);
 if(isTv) q['first_air_date.lte']=today;
 else q['primary_release_date.lte']=today;
 const result=await tmdb(`discover/${isTv?'tv':'movie'}`,q);
 const metas=(result.results||[]).filter(r=>r.poster_path).map(r=>mapMeta(r,row.type)).filter(Boolean);
 return {metas:metas.slice(skip%20)};
}
async function handler(req,res){
 if(req.method==='OPTIONS'){res.statusCode=204;res.setHeader('Access-Control-Allow-Origin','*');res.end();return;}
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 const url=new URL(req.url||'/', 'https://local.invalid');
 let path=url.searchParams.get('path')||req.query?.path||url.pathname;
 if(path.startsWith('/api/index.js')||path.startsWith('/api')){
   const from=url.searchParams.get('path');if(from)path=from;
 }
 if(path==='/' || path==='/health')return json(res,200,{status:'ok',catalogs:DATA.rows.length,configured:Boolean(process.env.TMDB_API_KEY||process.env.TMDB_READ_ACCESS_TOKEN)});
 if(path==='/manifest.json')return json(res,200,createManifest());
 const match=path.match(/^\/catalog\/(movie|series)\/([a-z0-9_]+)(?:\/skip=(\d+))?\.json$/i);
 if(!match)return json(res,404,{error:'Not found'});
 const type=match[1],row=catalogById.get(match[2]);
 if(!row || row.type!==type)return json(res,404,{error:'Unknown catalog'});
 const skipRaw=Number(match[3]||url.searchParams.get('skip')||0);
 if(!Number.isInteger(skipRaw)||skipRaw<0||skipRaw>10000)return json(res,400,{error:'Invalid skip'});
 try{
  apiAuth();
  const key=`catalog:${row.id}:${skipRaw}:${regionFor(row.service)}`;
  return json(res,200,await cached(key,MEMORY_TTL_MS,()=>buildCatalog(row,skipRaw)));
 }catch(e){
  // Never label a generic catalog as Netflix/HBO/etc when TMDB is down.
  return json(res,503,{error:'Unable to load platform-filtered catalog',detail:e.message});
 }
}
module.exports=handler;
module.exports.createManifest=createManifest;
module.exports.chooseFilters=chooseFilters;
module.exports.regionFor=regionFor;
