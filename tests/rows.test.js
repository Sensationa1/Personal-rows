'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/index');
const manifest=handler.createManifest();
function invoke(url){return new Promise(resolve=>{
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(str=''){resolve({status:this.statusCode,json:str?JSON.parse(str):null})}};
 handler({url,method:'GET'},res);
 });}
test('manifest has 48 unique per-provider catalog IDs with valid types',()=>{
 assert.equal(manifest.catalogs.length,48);
 assert.equal(new Set(manifest.catalogs.map(r=>r.id)).size,48);
 for(const row of manifest.catalogs){assert.ok(['movie','series'].includes(row.type));assert.ok(row.name.includes(' • '));}
});
test('service-only metadata catalog uses TMDB watch provider, region and genre filters',async()=>{
 process.env.TMDB_API_KEY='MOCK_TEST';
 const old=global.fetch;
 const seen=[];
 global.fetch=async uri=>{
  const u=new URL(String(uri));seen.push(u);
  if(u.pathname.includes('/watch/providers/'))return {ok:true,json:async()=>({results:[{provider_id:8,provider_name:'Netflix'},{provider_id:9,provider_name:'Amazon Prime Video'}]})};
  return {ok:true,json:async()=>({results:[{id:42,name:'Test Show',poster_path:'/abc.jpg',backdrop_path:'/xyz.jpg',overview:'Test'}]})};
 };
 try{
   const response=await invoke('/catalog/series/hub_netflix_01.json');
   assert.equal(response.status,200);
   assert.equal(response.json.metas[0].id,'tmdb:42');
   const discover=seen.find(u=>u.pathname.endsWith('/discover/tv'));
   assert.equal(discover.searchParams.get('with_watch_providers'),'8');
   assert.equal(discover.searchParams.get('watch_region'),'FI');
   assert.equal(discover.searchParams.get('with_genres'),'80|9648');
   assert.equal(discover.searchParams.get('with_watch_monetization_types'),'flatrate');
 }finally{global.fetch=old;delete process.env.TMDB_API_KEY;}
});
test('unknown catalog errors instead of silently showing an unrelated row',async()=>{
 const response=await invoke('/catalog/movie/hub_unknown_01.json');
 assert.equal(response.status,404);
});
test('manifest endpoint returns stremio catalog manifest',async()=>{
 const response=await invoke('/manifest.json');
 assert.equal(response.status,200);
 assert.equal(response.json.id,'com.nuvio.platform.hubs.curated');
});
