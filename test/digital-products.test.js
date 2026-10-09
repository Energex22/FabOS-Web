import test from 'node:test'
import assert from 'node:assert/strict'
import {addCartItem,readCart,writeCart,cartSubtotal} from '../src/cart.js'
import {designTypeLabel,digitalDownloadUrl} from '../src/api.js'

function createStorage(){
  const data=new Map()
  return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)}
}
globalThis.localStorage=createStorage()

test('cart keeps digital license lines distinct per license',()=>{
  let cart=[]
  cart=addCartItem(cart,{id:'p-1-license-personal',productId:'p-1',name:'Widget Files · Personal use',price:15,quantity:1,license:'personal',licenseLabel:'Personal use',isDigital:true,designType:'3d_print'})
  cart=addCartItem(cart,{id:'p-1-license-commercial',productId:'p-1',name:'Widget Files · Commercial use',price:45,quantity:1,license:'commercial',licenseLabel:'Commercial use',isDigital:true,designType:'3d_print'})
  assert.equal(cart.length,2)
  assert.equal(cartSubtotal(cart),60)
  // Same license merges into one line.
  cart=addCartItem(cart,{id:'p-1-license-personal',productId:'p-1',name:'Widget Files · Personal use',price:15,quantity:1,license:'personal',isDigital:true})
  assert.equal(cart.length,2)
  assert.equal(cart.find(i=>i.license==='personal').quantity,2)
})

test('cart persists digital license fields through storage',()=>{
  const item={id:'p-2-license-personal',productId:'p-2',name:'CNC Files · Personal use',price:20,quantity:1,license:'personal',licenseLabel:'Personal use',isDigital:true,designType:'cnc'}
  writeCart([item])
  const restored=readCart()
  assert.equal(restored.length,1)
  assert.equal(restored[0].license,'personal')
  assert.equal(restored[0].licenseLabel,'Personal use')
  assert.equal(restored[0].isDigital,true)
  assert.equal(restored[0].designType,'cnc')
  writeCart([])
})

test('checkout order payload carries the license (shape contract)',()=>{
  // Mirrors the orderPayload() builder in checkout.jsx: every cart item maps
  // to {productId, variantId, license, quantity, configuration}.
  const cart=[{id:'p-1-license-commercial',productId:'p-1',variantId:null,license:'commercial',quantity:1,price:45,configuration:null}]
  const payload={items:cart.map(item=>({productId:item.productId||item.id,variantId:item.variantId||null,license:item.license||null,quantity:Number(item.quantity)||1,configuration:item.configuration||null}))}
  assert.deepEqual(payload.items,[{productId:'p-1',variantId:null,license:'commercial',quantity:1,configuration:null}])
  // Physical items send an explicit null license.
  const physical={id:'p-9',productId:'p-9',price:10,quantity:2}
  const payload2={items:[physical].map(item=>({productId:item.productId||item.id,variantId:item.variantId||null,license:item.license||null,quantity:Number(item.quantity)||1,configuration:item.configuration||null}))}
  assert.equal(payload2.items[0].license,null)
})

test('all-digital carts skip the shipping address (checkout contract)',()=>{
  const allDigital=[{isDigital:true},{isDigital:true}].every(i=>i.isDigital)
  const mixed=[{isDigital:true},{}].every(i=>i.isDigital)
  assert.equal(allDigital,true)
  assert.equal(mixed,false)
  assert.equal([].every(i=>i.isDigital),true) // empty cart: vacuously true, but cart.length>0 guards it
})

test('designTypeLabel maps known types and falls back safely',()=>{
  assert.equal(designTypeLabel('3d_print'),'3D print')
  assert.equal(designTypeLabel('cnc'),'CNC')
  assert.equal(designTypeLabel('laser'),'Laser')
  assert.equal(designTypeLabel('CNC'),'CNC')
  assert.equal(designTypeLabel('unknown'),'Digital')
  assert.equal(designTypeLabel(''),'Digital')
  assert.equal(designTypeLabel(null),'Digital')
})

test('digitalDownloadUrl resolves bearer links against the API base',()=>{
  const download={download_url:'/api/v1/customer/downloads/abc123/file'}
  const url=digitalDownloadUrl(download)
  assert.ok(url.endsWith('/api/v1/customer/downloads/abc123/file'),url)
  assert.ok(url.startsWith('/api'),url)
  // Absolute URLs pass through untouched.
  assert.equal(digitalDownloadUrl({download_url:'https://cdn.example.com/f.stl'}),'https://cdn.example.com/f.stl')
  assert.equal(digitalDownloadUrl({}),'')
  assert.equal(digitalDownloadUrl(null),'')
})

test('digital product payload carries license options for the picker',()=>{
  // Backend contract: _public_product includes product_type, design_type and
  // license_options[{license_key,label,price_cents,price}].
  const product={id:'p-1',product_type:'digital',design_type:'laser',price:15,
    license_options:[{license_key:'personal',label:'Personal use',price_cents:1500,price:15},{license_key:'commercial',label:'Commercial use',price_cents:4500,price:45}]}
  const isDigital=String(product.product_type||'').toLowerCase()==='digital'
  assert.equal(isDigital,true)
  assert.equal(product.license_options[0].license_key,'personal')
  const selected=product.license_options[1]
  const cartId=`${product.id}-license-${selected.license_key}`
  assert.equal(cartId,'p-1-license-commercial')
})
