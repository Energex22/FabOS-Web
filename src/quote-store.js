const QUOTES_KEY='fabos.custom-requests'

function read(){
 if(typeof localStorage==='undefined')return []
 try{return JSON.parse(localStorage.getItem(QUOTES_KEY)||'[]')||[]}catch{return []}
}

export function createQuoteNumber(){
 const date=new Date().toISOString().slice(0,10).replaceAll('-','')
 const random=Math.floor(1000+Math.random()*9000)
 return `CST-${date}-${random}`
}

export function saveQuoteRequest(request){
 const next=[request,...read()]
 if(typeof localStorage!=='undefined')localStorage.setItem(QUOTES_KEY,JSON.stringify(next))
 return request
}
