import {authHeaders,clearToken,getToken,setToken,AUTH_TOKEN_KEY} from './auth.js'
const configuredApiBase=import.meta.env.VITE_API_URL||import.meta.env.VITE_API_BASE_URL
const API_BASE=(configuredApiBase||((typeof window!=='undefined'&&window.location.hostname)?`${window.location.protocol}//${window.location.hostname}:8000`:'http://127.0.0.1:8000')).replace(/\/$/,'')

function apiUrl(path){
 const normalized=String(path||'').startsWith('/')?String(path):`/${path}`
 if(API_BASE.endsWith('/api') && normalized.startsWith('/api/'))return `${API_BASE}${normalized.slice(4)}`
 if(API_BASE==='/' || API_BASE==='')return normalized
 return `${API_BASE}${normalized}`
}
function publicError(message,fallback){
 const detail=typeof message==='string'?message:''
 if(!detail)return fallback
 return detail.replace(/https?:\/\/[^\s/]+(?::\d+)?/gi,'the service')
}

async function request(path,options={}){
 let response
 try{
  response=await fetch(apiUrl(path),{headers:{'Content-Type':'application/json',...authHeaders(),...(options.headers||{})},...options})
 }catch(err){
  throw new Error(`Unable to reach the Fabvex service. ${publicError(err?.message,'Network request failed')}`)
 }
 let data=null
 try{data=await response.json()}catch(_){data=null}
 if(!response.ok)throw new Error(publicError((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||'',`API request failed: ${response.status}`))
 return data
}

async function multipartRequest(path,formData){
 let response
 try{response=await fetch(apiUrl(path),{method:'POST',headers:{...authHeaders()},body:formData})}
 catch(err){throw new Error(`Unable to reach the Fabvex service. ${publicError(err?.message,'Network request failed')}`)}
 let data=null
 try{data=await response.json()}catch(_){data=null}
 if(!response.ok)throw new Error(publicError((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||'',`API request failed: ${response.status}`))
 return data
}

export async function getPublicCatalog(params={}){const search=new URLSearchParams();if(params.q)search.set('q',params.q);if(params.category&&params.category!=='All')search.set('category',params.category);if(params.sort)search.set('sort',params.sort);if(params.desc)search.set('desc','1');const suffix=search.toString()?`?${search.toString()}`:'';const data=await request(`/api/v1/catalog${suffix}`);return data.products||[]}
export async function getPublicProduct(productId){return request(`/api/v1/catalog/${encodeURIComponent(productId)}`)}
export async function getCatalogCategories(){const data=await request('/api/v1/catalog/categories');return data.categories||[]}

export function catalogImageUrl(image){
 if(!image)return ''
 const value=String(image.url||image.path||'').trim()
 if(!value)return ''
 if(/^https?:\/\//i.test(value)||value.startsWith('data:')||value.startsWith('blob:'))return value
 return apiUrl(value)
}
export async function loginCustomer(identifier,password){const data=await request('/api/v1/auth/login',{method:'POST',body:JSON.stringify({identifier,password})});if(data?.token)setToken(data.token);return data}
export async function registerCustomer(name,email,password,phone=''){const data=await request('/api/v1/auth/register',{method:'POST',body:JSON.stringify({name,email,password,phone})});if(data?.token)setToken(data.token);return data}
export function logoutCustomer(){const token=getToken();clearToken();return token?request('/api/v1/auth/logout',{method:'POST'}).catch(()=>null):Promise.resolve(null)}
export async function createPublicQuoteWithFile(payload,file){
 const buffer=await file.arrayBuffer()
 const bytes=new Uint8Array(buffer)
 let binary=''
 const chunkSize=0x8000
 for(let offset=0;offset<bytes.length;offset+=chunkSize)binary+=String.fromCharCode(...bytes.subarray(offset,Math.min(offset+chunkSize,bytes.length)))
 const fileBase64=btoa(binary)
 return request('/api/v1/quote-requests',{method:'POST',body:JSON.stringify({
  name:payload.name,email:payload.email,project:payload.project,
  file_name:file.name,file_base64:fileBase64
 })})
}

export async function loginTeam(identifier,password){const data=await request('/api/v1/auth/team-login',{method:'POST',body:JSON.stringify({identifier,password})});const type=String(data?.user?.account_type||'').toLowerCase();if(!['employee','administrator'].includes(type))throw new Error('A team or administrator account is required.');if(data?.token)setToken(data.token);return data}
export async function getOperationsDashboard(){return request('/api/v1/admin/operations/dashboard')}
export async function runOperationsAutomation(){return request('/api/v1/admin/operations/automation/tick',{method:'POST'})}

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
