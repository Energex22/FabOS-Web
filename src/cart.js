export const CART_KEY='fabos.cart'

function normalizeItem(item){
  if(!item||typeof item!=='object')return null
  const quantity=Math.max(1,Math.floor(Number(item.quantity)||0))
  const price=Number(item.price)
  if(!item.id||!Number.isFinite(price)||price<0||quantity<1)return null
  return {...item,quantity,price}
}

export function readCart(){
  try{
    const parsed=JSON.parse(localStorage.getItem(CART_KEY)||'[]')
    if(!Array.isArray(parsed))return[]
    return parsed.map(normalizeItem).filter(Boolean)
  }catch{return[]}
}

export function writeCart(cart){
  localStorage.setItem(CART_KEY,JSON.stringify(Array.isArray(cart)?cart.map(normalizeItem).filter(Boolean):[]))
}

export function cartCount(cart){return cart.reduce((n,item)=>n+Math.max(0,Number(item.quantity)||0),0)}
export function cartSubtotal(cart){return cart.reduce((n,item)=>n+Math.max(0,Number(item.price)||0)*Math.max(0,Number(item.quantity)||0),0)}

export function addCartItem(cart,item){
  const normalized=normalizeItem(item)
  if(!normalized)return Array.isArray(cart)?cart.map(normalizeItem).filter(Boolean):[]
  const existing=cart.find(i=>i.id===normalized.id)
  return existing?cart.map(i=>i.id===normalized.id?{...i,quantity:(Number(i.quantity)||0)+normalized.quantity}:i):[...cart,normalized]
}

export function changeCartItem(cart,id,delta){
  const amount=Number(delta)||0
  return cart.flatMap(item=>item.id!==id?[item]:Number(item.quantity)+amount>0?[{...item,quantity:Math.floor(Number(item.quantity)+amount)}]:[])
}
