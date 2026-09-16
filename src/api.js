const API_BASE=import.meta.env.VITE_API_URL||import.meta.env.VITE_API_BASE_URL||''

async function request(path,options={}){
 const response=await fetch(`${API_BASE}${path}`,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options})
 if(!response.ok)throw new Error(`API request failed: ${response.status}`)
 return response.status===204?null:response.json()
}

export const customerApi={
  health:()=>request('/api/health'),
  createQuote:(payload)=>request('/api/v1/customer/quotes',{method:'POST',body:JSON.stringify(payload)}),
  createOrder:(payload)=>request('/api/v1/customer/orders',{method:'POST',body:JSON.stringify(payload)})
}

export {API_BASE}
