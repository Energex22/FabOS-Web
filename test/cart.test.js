import test from 'node:test'
import assert from 'node:assert/strict'
import {addCartItem,cartCount,cartSubtotal,changeCartItem,readCart,writeCart} from '../src/cart.js'

function createStorage(){
  const data=new Map()
  return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)}
}

globalThis.localStorage=createStorage()

test('cart ignores invalid persisted entries',()=>{
  localStorage.setItem('fabos.cart',JSON.stringify([{id:'ok',price:12.5,quantity:2},{id:'bad',price:'not-a-price',quantity:1},null]))
  assert.deepEqual(readCart(),[{id:'ok',price:12.5,quantity:2}])
})

test('cart merges identical configured items and calculates totals',()=>{
  let cart=[]
  cart=addCartItem(cart,{id:'p-1-v-1',productId:'p-1',variantId:'v-1',name:'Widget · Black',price:8.5,quantity:2})
  cart=addCartItem(cart,{id:'p-1-v-1',productId:'p-1',variantId:'v-1',name:'Widget · Black',price:8.5,quantity:1})
  assert.equal(cartCount(cart),3)
  assert.equal(cartSubtotal(cart),25.5)
})

test('cart removes an item when its quantity reaches zero',()=>{
  const cart=changeCartItem([{id:'p-1',price:10,quantity:1}], 'p-1', -1)
  assert.deepEqual(cart,[])
})

test('cart storage failure is safe',()=>{
  globalThis.localStorage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')},removeItem(){}}
  assert.deepEqual(readCart(),[])
  assert.equal(writeCart([{id:'p',price:1,quantity:1}]),false)
  globalThis.localStorage=createStorage()
})
