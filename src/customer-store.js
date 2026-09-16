const CUSTOMER_KEY='fabos.customer'

function safeParse(value,fallback){
 try{return JSON.parse(value)||fallback}catch{return fallback}
}

function createCustomerId(){
 if(typeof crypto!=='undefined'&&crypto.randomUUID)return crypto.randomUUID()
 return `cust-${Date.now()}-${Math.random().toString(36).slice(2,10)}`
}

export function readCustomer(){
 if(typeof localStorage==='undefined')return null
 const value=safeParse(localStorage.getItem(CUSTOMER_KEY)||'null',null)
 return value&&value.id?value:null
}

export function saveCustomer(profile){
 if(typeof localStorage==='undefined')return profile
 const current=readCustomer()
 const customer={id:current?.id||createCustomerId(),name:String(profile.name||'').trim(),email:String(profile.email||'').trim(),updatedAt:new Date().toISOString()}
 localStorage.setItem(CUSTOMER_KEY,JSON.stringify(customer))
 return customer
}

export function clearCustomer(){
 if(typeof localStorage!=='undefined')localStorage.removeItem(CUSTOMER_KEY)
}
