import test from 'node:test'
import assert from 'node:assert/strict'
import {cadArtifactUrl,customerApi} from '../src/api.js'

function createStorage(){
  const data=new Map()
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key),
  }
}

test('cadArtifactUrl resolves relative artifact URLs against the API base',()=>{
  assert.equal(cadArtifactUrl({url:'/api/v1/customer/cad/artifacts/job-1/stl'}),'/api/v1/customer/cad/artifacts/job-1/stl')
})

test('cadArtifactUrl passes absolute URLs through unchanged',()=>{
  assert.equal(cadArtifactUrl({url:'https://api.example.com/api/v1/customer/cad/artifacts/job-1/stl'}),'https://api.example.com/api/v1/customer/cad/artifacts/job-1/stl')
  assert.equal(cadArtifactUrl({url:'blob:https://example.com/abc'}),'blob:https://example.com/abc')
})

test('cadArtifactUrl returns empty string for missing artifacts',()=>{
  assert.equal(cadArtifactUrl(null),'')
  assert.equal(cadArtifactUrl({}),'')
})

test('multipartRequest sets error.status so callers can detect 401s',async()=>{
  globalThis.localStorage=createStorage()
  const previousFetch=globalThis.fetch
  globalThis.fetch=async ()=>({ok:false,status:401,json:async()=>({error:'Unauthorized'})})
  try{
    const err=await customerApi.analyzeCadReference([], '').then(()=>null,e=>e)
    assert.ok(err instanceof Error)
    assert.equal(err.status,401)
  }finally{
    globalThis.fetch=previousFetch
  }
})

test('requestBlob sets error.status so callers can detect 401s',async()=>{
  globalThis.localStorage=createStorage()
  const previousFetch=globalThis.fetch
  globalThis.fetch=async ()=>({ok:false,status:401,json:async()=>({error:'Unauthorized'})})
  try{
    const err=await customerApi.proofFile('proof-1').then(()=>null,e=>e)
    assert.ok(err instanceof Error)
    assert.equal(err.status,401)
  }finally{
    globalThis.fetch=previousFetch
  }
})
