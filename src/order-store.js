const ORDERS_KEY='fabos.orders'

export const ORDER_STATUS_STEPS=[
 {key:'received',label:'Order received'},
 {key:'payment',label:'Payment'},
 {key:'preparing',label:'Preparing your order'},
 {key:'quality',label:'Final quality check'},
 {key:'shipping',label:'Shipping'},
 {key:'delivered',label:'Delivered'}
]

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

export function getOrderStatusIndex(status){
 const normalized=String(status||'').trim().toLowerCase()
 const aliases={'order received':'received','received':'received','payment':'payment','preparing':'preparing','preparing your order':'preparing','quality':'quality','final quality check':'quality','shipping':'shipping','delivered':'delivered'}
 const key=aliases[normalized]||'received'
 return Math.max(0,ORDER_STATUS_STEPS.findIndex(step=>step.key===key))
}

export function getOrderStatusLabel(status){
 return ORDER_STATUS_STEPS[getOrderStatusIndex(status)]?.label||ORDER_STATUS_STEPS[0].label
}
