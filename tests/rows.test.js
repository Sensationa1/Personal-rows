'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/index');
const data=require('../catalogs.json');
function invoke(url){return new Promise(resolve=>{
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(str=''){resolve({status:this.statusCode,json:str?JSON.parse(str):null})}};
 Promise.resolve(handler({url,method:'GET'},res)).catch(e=>resolve({status:599,error:e.message}));
 });}
test('57 rows without bullets, prefixes or duplicate ids',()=>{
 const m=handler.createManifest();
 assert.equal(m.catalogs.length,57);
 assert.equal(new Set(m.catalogs.map(x=>x.id)).size,57);
 assert.equal(new Set(m.catalogs.map(x=>x.type)).size,2);
 for(const c of m.catalogs){assert.ok(!c.name.includes(' • '));assert.ok(!/^Netflix •|^Disney\+ •|^Apple TV\+ •|^HBO Max •/.test(c.name));}
});
test('8 separate manifests each return only their platform',async()=>{
 for(const [service,slug] of Object.entries(data.serviceSlugs)){
  const a=await invoke(`/${slug}/manifest.json`);
  assert.equal(a.status,200);assert.equal(a.json.catalogs.length,data.rows.filter(r=>r.service===service).length);
  assert.equal(a.json.name,`${service} — Home Rows`);
  assert.ok(a.json.id.endsWith(slug.replace(/-/g,'_')));
 }
});
test('network originals, studios, recent sorting and platform provider scope',async()=>{
 process.env.TMDB_API_KEY='MOCK_TEST';
 const old=global.fetch;const requests=[];
 global.fetch=async uri=>{
  const u=new URL(String(uri));requests.push(u);
  if(u.pathname.includes('/watch/providers/'))return {ok:true,json:async()=>({results:[
   {provider_id:8,provider_name:'Netflix'},
   {provider_id:337,provider_name:'Disney Plus'},
   {provider_id:9,provider_name:'Amazon Prime Video'}]})};
  return {ok:true,json:async()=>({results:[{id:42,name:'Test Show',title:'Test Movie',poster_path:'/abc.jpg',backdrop_path:'/xyz.jpg',overview:'Test'}]})};
 };
 try{
  let res=await invoke('/netflix/catalog/series/hub_netflix_02.json');
  assert.equal(res.status,200);assert.equal(res.json.metas[0].id,'tmdb:42');
  let d=requests.find(u=>u.pathname.endsWith('/discover/tv'));
  assert.equal(d.searchParams.get('with_watch_providers'),'8');
  assert.equal(d.searchParams.get('watch_region'),'FI');
  assert.equal(d.searchParams.get('with_networks'),'213');
  requests.length=0;
  res=await invoke('/disney-plus/catalog/movie/hub_disney_plus_05.json');
  assert.equal(res.status,200);
  d=requests.find(u=>u.pathname.endsWith('/discover/movie'));
  assert.equal(d.searchParams.get('with_companies'),'3');
  assert.equal(d.searchParams.get('with_watch_providers'),'337');
  requests.length=0;
  res=await invoke('/prime-video/catalog/series/hub_prime_video_03.json');
  assert.equal(res.status,200);
  d=requests.find(u=>u.pathname.endsWith('/discover/tv'));
  assert.equal(d.searchParams.get('sort_by'),'first_air_date.desc');
  assert.equal(d.searchParams.get('with_watch_providers'),'9');
 }finally{global.fetch=old;delete process.env.TMDB_API_KEY;}
});
test('catalog paths cannot be accessed under the wrong platform',async()=>{
 assert.equal((await invoke('/netflix/catalog/movie/hub_disney_plus_05.json')).status,404);
 assert.equal((await invoke('/unknown/manifest.json')).status,404);
});
test('top 10 proxy row is capped at ten, no fake personalized history',async()=>{
 process.env.TMDB_API_KEY='MOCK_TEST';
 const old=global.fetch;
 global.fetch=async uri=>{
  const u=new URL(String(uri));
  if(u.pathname.includes('/watch/providers/'))return {ok:true,json:async()=>({results:[{provider_id:350,provider_name:'Apple TV Plus'}]})};
  return {ok:true,json:async()=>({results:Array.from({length:20},(_,i)=>({id:i+1,name:`A${i+1}`,poster_path:'/a.jpg'}))})};
 };
 try{
  const a=await invoke('/apple-tv/catalog/series/hub_apple_tv_04.json');
  assert.equal(a.status,200);assert.equal(a.json.metas.length,10);
  const b=await invoke('/apple-tv/catalog/series/hub_apple_tv_04/skip=10.json');
  assert.equal(b.status,200);assert.equal(b.json.metas.length,0);
 }finally{global.fetch=old;delete process.env.TMDB_API_KEY;}
});
