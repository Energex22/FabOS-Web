export const CART_KEY='fabos.cart'

function storage(){
  if(typeof localStorage==='undefined')return null
  try{
    const key='__fabvex_storage_test__'
    localStorage.setItem(key,'1')
    localStorage.removeItem(key)
    return localStorage
  }catch{return null}
}

function normalizeItem(item){
  if(!item||typeof item!=='object')return null
  const quantity=Math.max(1,Math.floor(Number(item.quantity)||0))
  const price=Number(item.price)
  if(!item.id||!Number.isFinite(price)||price<0||quantity<1)return null
  return {...item,quantity,price}
}

export function readCart(){
  const store=storage()
  if(!store)return[]
  try{
    const parsed=JSON.parse(store.getItem(CART_KEY)||'[]')
    if(!Array.isArray(parsed))return[]
    return parsed.map(normalizeItem).filter(Boolean)
  }catch{return[]}
}

export function writeCart(cart){
  const store=storage()
  if(!store)return false
  try{
    store.setItem(CART_KEY,JSON.stringify(Array.isArray(cart)?cart.map(normalizeItem).filter(Boolean):[]))
    return true
  }catch{return false}
}

export function cartCount(cart){return cart.reduce((n,item)=>n+Math.max(0,Number(item.quantity)||0),0)}
export function cartSubtotal(cart){return cart.reduce((n,item)=>n+Math.max(0,Number(item.price)||0)*Math.max(0,Number(item.quantity)||0),0)}

export function addCartItem(cart,item){
  const normalized=normalizeItem(item)
  const current=Array.isArray(cart)?cart.map(normalizeItem).filter(Boolean):[]
  if(!normalized)return current
  const existing=current.find(i=>i.id===normalized.id)
  return existing?current.map(i=>i.id===normalized.id?{...i,quantity:(Number(i.quantity)||0)+normalized.quantity}:i):[...current,normalized]
}

export function changeCartItem(cart,id,delta){
  const amount=Number(delta)||0
  return (Array.isArray(cart)?cart:[]).map(normalizeItem).filter(Boolean).flatMap(item=>item.id!==id?[item]:Number(item.quantity)+amount>0?[{...item,quantity:Math.floor(Number(item.quantity)+amount)}]:[])
}
