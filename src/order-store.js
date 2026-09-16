const ORDERS_KEY='fabos.orders'

function safeParse(value,fallback){
 try{return JSON.parse(value)||fallback}catch{return fallback}
}

export function readOrders(){
 if(typeof localStorage==='undefined')return []
 return safeParse(localStorage.getItem(ORDERS_KEY)||'[]',[])
}

export function writeOrders(orders){
 if(typeof localStorage!=='undefined')localStorage.setItem(ORDERS_KEY,JSON.stringify(orders))
}

export function createOrderNumber(){
 const stamp=new Date()
 const date=`${stamp.getFullYear()}${String(stamp.getMonth()+1).padStart(2,'0')}${String(stamp.getDate()).padStart(2,'0')}`
 const random=Math.floor(1000+Math.random()*9000)
 return `FBO-${date}-${random}`
}

export function saveOrder(order){
 const orders=readOrders()
 writeOrders([order,...orders])
 return order
}

export function findOrder(orderNumber){
 return readOrders().find(order=>order.orderNumber===orderNumber)||null
}
