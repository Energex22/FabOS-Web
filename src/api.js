const configuredApiBase=import.meta.env.VITE_API_URL||import.meta.env.VITE_API_BASE_URL
const API_BASE=(configuredApiBase||((typeof window!=='undefined'&&window.location.hostname)?`${window.location.protocol}//${window.location.hostname}:8000`:'http://127.0.0.1:8000')).replace(/\/$/,'')
const AUTH_TOKEN_KEY='fabos.auth.token'

function authHeaders(){
 if(typeof localStorage==='undefined')return {}
 const token=localStorage.getItem(AUTH_TOKEN_KEY)
 return token?{Authorization:`Bearer ${token}`}:{ }
}

async function request(path,options={}){
 let response
 try{
  response=await fetch(`${API_BASE}${path}`,{headers:{'Content-Type':'application/json',...authHeaders(),...(options.headers||{})},...options})
 }catch(err){
  const reason=err?.message||'Network request failed'
  throw new Error(`Unable to reach the Fabvex catalog service at ${API_BASE}. ${reason}`)
 }
 let data=null
 try{data=await response.json()}catch(_){data=null}
 if(!response.ok)throw new Error((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||`API request failed: ${response.status}`)
 return data
}

async function multipartRequest(path,formData){
 let response
 try{response=await fetch(`${API_BASE}${path}`,{method:'POST',headers:{...authHeaders()},body:formData})}
 catch(err){throw new Error(`Unable to reach the Fabvex API at ${API_BASE}. ${err?.message||'Network request failed'}`)}
 let data=null
 try{data=await response.json()}catch(_){data=null}
 if(!response.ok)throw new Error((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||`API request failed: ${response.status}`)
 return data
}

export async function getPublicCatalog(params={}){const search=new URLSearchParams();if(params.q)search.set('q',params.q);if(params.category&&params.category!=='All')search.set('category',params.category);if(params.sort)search.set('sort',params.sort);if(params.desc)search.set('desc','1');const suffix=search.toString()?`?${search.toString()}`:'';const data=await request(`/api/v1/catalog${suffix}`);return data.products||[]}
export async function getPublicProduct(productId){const data=await request(`/api/v1/catalog/${encodeURIComponent(productId)}`);return data.product||data}
export async function getCatalogCategories(){const data=await request('/api/v1/catalog/categories');return data.categories||[]}
export async function loginCustomer(identifier,password){const data=await request('/api/v1/auth/login',{method:'POST',body:JSON.stringify({identifier,password})});if(data?.token&&typeof localStorage!=='undefined')localStorage.setItem(AUTH_TOKEN_KEY,data.token);return data}
export async function registerCustomer(name,email,password,phone=''){const data=await request('/api/v1/auth/register',{method:'POST',body:JSON.stringify({name,email,password,phone})});if(data?.token&&typeof localStorage!=='undefined')localStorage.setItem(AUTH_TOKEN_KEY,data.token);return data}
export function logoutCustomer(){const token=typeof localStorage!=='undefined'?localStorage.getItem(AUTH_TOKEN_KEY):null;if(typeof localStorage!=='undefined')localStorage.removeItem(AUTH_TOKEN_KEY);return token?request('/api/v1/auth/logout',{method:'POST'}).catch(()=>null):Promise.resolve(null)}
export async function createPublicQuoteWithFile(payload,file){
 const form=new FormData()
 form.set('name',payload.name);form.set('email',payload.email);form.set('idea',payload.project.idea);form.set('dimensions',payload.project.dimensions||'');form.set('material',payload.project.material||'');form.set('quantity',String(payload.project.quantity||1));form.set('notes',payload.project.notes||'');form.set('file',file)
 return multipartRequest('/api/v1/quote-requests/upload',form)
}
export const customerApi={
 health:()=>request('/api/v1/health'),
 catalog:getPublicCatalog,
 product:getPublicProduct,
 categories:getCatalogCategories,
 login:loginCustomer,
 register:registerCustomer,
 logout:logoutCustomer,
 me:()=>request('/api/v1/customer/me'),
 updateProfile:(payload)=>request('/api/v1/customer/me',{method:'PATCH',body:JSON.stringify(payload)}),
 quotes:()=>request('/api/v1/customer/quotes'),
 quote:(quoteId)=>request(`/api/v1/customer/quotes/${encodeURIComponent(quoteId)}`),
 createQuote:(payload)=>request('/api/v1/customer/quotes',{method:'POST',body:JSON.stringify(payload)}),
 createPublicQuote:(payload)=>request('/api/v1/quote-requests',{method:'POST',body:JSON.stringify(payload)}),
 createPublicQuoteWithFile,
 orders:()=>request('/api/v1/customer/orders'),
 order:(orderId)=>request(`/api/v1/customer/orders/${encodeURIComponent(orderId)}`),
 createOrder:(payload)=>request('/api/v1/customer/orders',{method:'POST',body:JSON.stringify(payload)}),
 createPaymentSession:(orderId)=>request(`/api/v1/customer/orders/${encodeURIComponent(orderId)}/payment-session`,{method:'POST'})
}
export {API_BASE,AUTH_TOKEN_KEY}
