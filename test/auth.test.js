import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {AUTH_TOKEN_KEY,authHeaders,clearToken,getToken,setToken,handleUnauthorized,clearAccountType,setAccountType,getAccountType} from '../src/auth.js'

const root=new URL('../',import.meta.url)

function createStorage(){
  const data=new Map()
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key),
  }
}

test('auth uses one shared token key and bearer header',()=>{
  globalThis.localStorage=createStorage()
  assert.equal(AUTH_TOKEN_KEY,'fabos.auth.token')
  setToken('token-123')
  assert.equal(getToken(),'token-123')
  assert.deepEqual(authHeaders(),{Authorization:'Bearer token-123'})
})

test('auth clear removes the shared token',()=>{
  globalThis.localStorage=createStorage()
  setToken('token-123')
  clearToken()
  assert.equal(getToken(),'')
  assert.deepEqual(authHeaders(),{})
})

test('auth storage failures fail closed',()=>{
  globalThis.localStorage={
    getItem(){throw new Error('blocked')},
    setItem(){throw new Error('blocked')},
    removeItem(){throw new Error('blocked')},
  }
  assert.equal(getToken(),'')
  assert.deepEqual(authHeaders(),{})
  assert.doesNotThrow(()=>setToken('token-123'))
  assert.doesNotThrow(()=>clearToken())
})

test('handleUnauthorized clears the token and account type then redirects to sign-in with a return path',()=>{
  globalThis.localStorage=createStorage()
  setToken('stale-token')
  setAccountType('customer')
  globalThis.window={location:{pathname:'/checkout.html',search:'',href:''}}
  try{
    handleUnauthorized()
    assert.equal(getToken(),'')
    assert.equal(getAccountType(),'')
    assert.equal(globalThis.window.location.href,'/account.html?return=%2Fcheckout.html')
  }finally{
    delete globalThis.window
  }
})

test('handleUnauthorized preserves query strings in the return path',()=>{
  globalThis.localStorage=createStorage()
  setToken('stale-token')
  globalThis.window={location:{pathname:'/order.html',search:'?id=order-1',href:''}}
  try{
    handleUnauthorized()
    assert.equal(globalThis.window.location.href,'/account.html?return=%2Forder.html%3Fid%3Dorder-1')
  }finally{
    delete globalThis.window
  }
})

test('anonymous submit warning covers reference-photo-only submissions',()=>{
  const src=readFileSync(new URL('src/custom-work.jsx',root),'utf8')
  assert.match(src,/if\(\(file\|\|referenceImages\.length\)&&!getToken\(\)\)/)
})
test('logout sends the token before clearing local auth state',async()=>{
  globalThis.localStorage=createStorage()
  setToken('token-logout')
  const previousFetch=globalThis.fetch
  let authorization=''
  globalThis.fetch=async (_url,options={})=>{
    authorization=options.headers?.Authorization||''
    return {ok:true,json:async()=>({ok:true})}
  }
  try{
    const {logoutCustomer}=await import('../src/api.js')
    await logoutCustomer()
    assert.equal(authorization,'Bearer token-logout')
    assert.equal(getToken(),'')
  }finally{
    globalThis.fetch=previousFetch
  }
})
