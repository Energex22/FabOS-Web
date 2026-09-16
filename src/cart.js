export const CART_KEY='fabos.cart'

export function readCart(){
  try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}
  catch{return[]}
}

export function writeCart(cart){
  localStorage.setItem(CART_KEY,JSON.stringify(cart))
}

export function cartCount(cart){return cart.reduce((n,item)=>n+item.quantity,0)}
export function cartSubtotal(cart){return cart.reduce((n,item)=>n+item.price*item.quantity,0)}

export function addCartItem(cart,item){
  const existing=cart.find(i=>i.id===item.id)
  return existing?cart.map(i=>i.id===item.id?{...i,quantity:i.quantity+item.quantity}:i):[...cart,item]
}

export function changeCartItem(cart,id,delta){
  return cart.flatMap(item=>item.id!==id?[item]:item.quantity+delta>0?[{...item,quantity:item.quantity+delta}]:[])
}
