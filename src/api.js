import {authHeaders,clearToken,getToken,setToken,AUTH_TOKEN_KEY,clearAccountType,setAccountType} from './auth.js'
const configuredApiBase=import.meta.env?.VITE_API_URL||import.meta.env?.VITE_API_BASE_URL||''
const API_BASE=(configuredApiBase||'/api').replace(/\/$/,'')

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
 if(!response.ok){const error=new Error(publicError((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||'',`API request failed: ${response.status}`));error.status=response.status;throw error}
 return data
}

async function multipartRequest(path,formData){
 let response
 try{response=await fetch(apiUrl(path),{method:'POST',headers:{...authHeaders()},body:formData})}
 catch(err){throw new Error(`Unable to reach the Fabvex service. ${publicError(err?.message,'Network request failed')}`)}
 let data=null
 try{data=await response.json()}catch(_){data=null}
 if(!response.ok){const error=new Error(publicError((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||'',`API request failed: ${response.status}`));error.status=response.status;throw error}
 return data
}

async function requestBlob(path,options={}){
 let response
 try{
  response=await fetch(apiUrl(path),{headers:{...authHeaders(),...(options.headers||{})},...options})
 }catch(err){
  throw new Error(`Unable to reach the Fabvex service. ${publicError(err?.message,'Network request failed')}`)
 }
 if(!response.ok){
  let data=null
  try{data=await response.json()}catch(_){data=null}
  const error=new Error(publicError((data&&data.detail?.message)||(data&&data.detail)||(data&&data.error)||'',`API request failed: ${response.status}`))
  error.status=response.status
  throw error
 }
 return response.blob()
}

export async function getPublicCatalog(params={}){const search=new URLSearchParams();if(params.q)search.set('q',params.q);if(params.category&&params.category!=='All')search.set('category',params.category);if(params.sort)search.set('sort',params.sort);if(params.desc)search.set('desc','1');const suffix=search.toString()?`?${search.toString()}`:'';const data=await request(`/api/v1/catalog${suffix}`);return data.products||[]}
export async function getPublicProduct(productId){return request(`/api/v1/catalog/${encodeURIComponent(productId)}`)}
export async function getCatalogCategories(){const data=await request('/api/v1/catalog/categories');return data.categories||[]}

export function catalogImageUrl(image){
 if(!image)return ''
 const value=String(image.url||image.path||'').trim()
 if(!value)return ''
 if(/^https?:\/\//i.test(value)||value.startsWith('blob:'))return value
 if(value.startsWith('data:'))return ''
 return apiUrl(value)
}
export function cadArtifactUrl(artifact){
 if(!artifact)return ''
 const value=String(artifact.url||artifact.path||'').trim()
 if(!value)return ''
 if(/^https?:\/\//i.test(value)||value.startsWith('blob:'))return value
 if(value.startsWith('data:'))return ''
 return apiUrl(value)
}
export async function loginCustomer(identifier,password){const data=await request('/api/v1/auth/login',{method:'POST',body:JSON.stringify({identifier,password})});if(data?.token){setToken(data.token);clearAccountType()}return data}
export async function registerCustomer(name,email,password,phone=''){const data=await request('/api/v1/auth/register',{method:'POST',body:JSON.stringify({name,email,password,phone})});if(data?.token){setToken(data.token);clearAccountType()}return data}
export async function logoutCustomer(){const token=getToken();if(!token){clearToken();clearAccountType();return null}try{return await request('/api/v1/auth/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}})}catch{return null}finally{clearToken();clearAccountType()}}

export async function analyzeCustomerCadReference(files,referenceNote=''){
 const formData=new FormData()
 formData.append('reference_note',referenceNote||'')
 ;files.slice(0,4).forEach(file=>formData.append('files',file,file.name))
 return multipartRequest('/api/v1/customer/cad/analyze-reference',formData)
}

export async function createCustomerQuoteWithFile(payload,file){
 const formData=new FormData()
 formData.append('idea',payload.project?.idea||'')
 formData.append('dimensions',payload.project?.dimensions||'')
 formData.append('material',payload.project?.material||'')
 formData.append('quantity',String(payload.project?.quantity||1))
 formData.append('notes',payload.project?.notes||'')
 if(payload.project?.cad_job_id)formData.append('cad_job_id',payload.project.cad_job_id)
 formData.append('file',file,file.name)
 return multipartRequest('/api/v1/customer/quotes/upload',formData)
}

export async function generateCustomerCad(payload){return request('/api/v1/customer/cad/generate',{method:'POST',body:JSON.stringify(payload)})}
export async function getCustomerCadJobs(limit=50){return request('/api/v1/customer/cad/jobs?limit='+encodeURIComponent(limit))}
export async function getCustomerCadCapabilities(){return request('/api/v1/customer/cad/capabilities')}
export async function getCustomerCadPrinters(){return request('/api/v1/customer/cad/printers')}
export async function preflightCustomerCad(payload){return request('/api/v1/customer/cad/preflight',{method:'POST',body:JSON.stringify(payload)})}
export async function reviseCustomerCad(jobId,instruction,outputFormats=['stl','step','3mf']){
 return request('/api/v1/customer/cad/jobs/'+encodeURIComponent(jobId)+'/revise',{method:'POST',body:JSON.stringify({instruction,output_formats:outputFormats})})
}

export async function loginTeam(identifier,password){const data=await request('/api/v1/auth/team-login',{method:'POST',body:JSON.stringify({identifier,password})});const type=String(data?.user?.account_type||'').toLowerCase();if(!['employee','administrator'].includes(type))throw new Error('A team or administrator account is required.');if(data?.token){setToken(data.token);setAccountType(type)}return data}
export async function getOperationsDashboard(){return request('/api/v1/admin/operations/dashboard')}
export async function runOperationsAutomation(){return request('/api/v1/admin/operations/automation/tick',{method:'POST'})}

export async function getAdminInvoices(params={}){const q=new URLSearchParams();if(params.q)q.set('q',params.q);if(params.status)q.set('status',params.status);if(params.sort)q.set('sort',params.sort);if(params.desc!=null)q.set('desc',params.desc?'1':'0');const suffix=q.toString()?'?'+q.toString():'';return request('/api/v1/invoices'+suffix)}
export async function getAdminInvoice(invoiceId){return request('/api/v1/invoices/'+encodeURIComponent(invoiceId))}
export async function getAdminFulfillments(){return request('/api/v1/fulfillments')}
export async function getAdminFulfillment(fulfillmentId){return request('/api/v1/fulfillments/'+encodeURIComponent(fulfillmentId))}
export async function getSystemHealth(){return request('/api/v1/health')}

export async function getAdminCatalog(q=''){const data=await request('/api/v1/admin/catalog?q='+encodeURIComponent(q||''));return data}
export async function updateAdminStorefront(productId,payload){return request('/api/v1/admin/catalog/'+encodeURIComponent(productId)+'/storefront',{method:'PATCH',body:JSON.stringify(payload)})}
export async function getAdminCustomers(q=''){return request('/api/v1/admin/customers?q='+encodeURIComponent(q||''))}
export async function createAdminCustomer(payload){return request('/api/v1/admin/customers',{method:'POST',body:JSON.stringify(payload)})}
export async function getAdminQuotes(params={}){const q=new URLSearchParams();if(params.q)q.set('q',params.q);if(params.status)q.set('status',params.status);if(params.group)q.set('group',params.group);const suffix=q.toString()?'?'+q.toString():'';return request('/api/v1/admin/quotes'+suffix)}
export async function getAdminQuote(quoteId){return request('/api/v1/admin/quotes/'+encodeURIComponent(quoteId))}
export async function updateAdminQuote(quoteId,payload){return request('/api/v1/admin/quotes/'+encodeURIComponent(quoteId),{method:'PUT',body:JSON.stringify(payload)})}
export async function startAdminProduction(orderId){return request('/api/v1/admin/orders/'+encodeURIComponent(orderId)+'/start-production',{method:'POST'})}
export async function adminPrinterPreflight(id){return request('/api/v1/admin/printers/'+encodeURIComponent(id)+'/preflight',{method:'POST'})}
export async function adminPrinterPreheat(id,hotend,bed){return request('/api/v1/admin/printers/'+encodeURIComponent(id)+'/preheat',{method:'POST',body:JSON.stringify({hotend,bed})})}
export async function adminPrinterAction(id,action){return request('/api/v1/admin/printers/'+encodeURIComponent(id)+'/'+action,{method:'POST'})}
export async function getAdminDesigns(q=''){return request('/api/v1/admin/designs?q='+encodeURIComponent(q||''))}
export async function getAdminDesign(designId){return request('/api/v1/admin/designs/'+encodeURIComponent(designId))}
export async function getAdminQc(){return request('/api/v1/admin/qc')}
export async function getAdminQcDetail(inspectionId){return request('/api/v1/admin/qc/'+encodeURIComponent(inspectionId))}
export async function updateAdminQc(inspectionId,payload){return request('/api/v1/admin/qc/'+encodeURIComponent(inspectionId),{method:'PUT',body:JSON.stringify(payload)})}
export async function reconcileAdminQc(){return request('/api/v1/admin/qc/reconcile',{method:'POST'})}
// ---------------------------------------------------------------------------
// Admin design proofs (Phase 1 proof cycle). Wired to the admin proof
// endpoints: global list filterable by status, single-proof view (carries the
// staff notes plus the customer's change-request comment), per-quote list,
// create (draft or sent), multipart file upload, and send.
// ---------------------------------------------------------------------------
export async function getAdminProofs(params={}){
 const q=new URLSearchParams()
 if(params.status)q.set('status',params.status)
 const suffix=q.toString()?'?'+q.toString():''
 const data=await request('/api/v1/admin/proofs'+suffix)
 return data?.proofs||[]
}
export async function getAdminProof(proofId){
 const data=await request('/api/v1/admin/proofs/'+encodeURIComponent(proofId))
 return data?.proof||null
}
export async function getAdminQuoteProofs(quoteId,status){
 const q=new URLSearchParams()
 if(status)q.set('status',status)
 const suffix=q.toString()?'?'+q.toString():''
 const data=await request('/api/v1/admin/quotes/'+encodeURIComponent(quoteId)+'/proofs'+suffix)
 return data?.proofs||[]
}
export async function createAdminProof(quoteId,{notes='',customer_note='',send=false}={}){
 const data=await request('/api/v1/admin/quotes/'+encodeURIComponent(quoteId)+'/proofs',{method:'POST',body:JSON.stringify({notes,customer_note,send})})
 return data?.proof||null
}
export async function uploadAdminProof(quoteId,file,customerNote=''){
 const formData=new FormData()
 formData.append('file',file,file?.name||'proof')
 formData.append('customer_note',customerNote||'')
 const data=await multipartRequest('/api/v1/admin/quotes/'+encodeURIComponent(quoteId)+'/proofs/upload',formData)
 return data
}
export async function sendAdminProof(proofId,customerNote=''){
 const data=await request('/api/v1/admin/proofs/'+encodeURIComponent(proofId)+'/send',{method:'POST',body:JSON.stringify({customer_note:customerNote||''})})
 return data?.proof||null
}
/**
 * AI-draft seam for proof-send messages (Phase 1; the AI step itself ships later).
 *
 * Future contract: given the admin proof payload and its quote, return an
 * AI-drafted customer-facing message string for staff review, or null to keep
 * the staff-written per-revision note. The caller (proof send flow) must treat
 * a null/throwing result as "use the staff note" so the flow works today.
 *
 * Deliberately unimplemented — the send form shows a visible "AI drafting
 * coming" placeholder until this is built.
 */
export async function draft_proof_message(/* proof, quote */){
 return null
}
export async function getAdminUsers(){return request('/api/v1/admin/users')}
export async function getAdminPermissions(){return request('/api/v1/admin/permissions')}
export async function getAdminSettings(){return request('/api/v1/admin/settings')}
export async function updateAdminSetting(key,value){return request('/api/v1/admin/settings',{method:'PUT',body:JSON.stringify({key,value})})}
export async function getAdminAiStatus(){return request('/api/v1/admin/ai/status')}
export async function sendAdminAiMessage(message,context){return request('/api/v1/admin/ai/chat',{method:'POST',body:JSON.stringify({message,context})})}
export async function getAdminMarketingDashboard(){return request('/api/v1/admin/marketing/dashboard')}
export async function getAdminMarketingProviders(){return request('/api/v1/admin/marketing/providers')}
export async function getAdminMarketingPosts(status,limit=100){const q=new URLSearchParams();if(status)q.set('status',status);q.set('limit',String(limit));return request('/api/v1/admin/marketing/posts?'+q.toString())}
export async function approveAdminMarketingPost(postId){return request('/api/v1/admin/marketing/posts/'+encodeURIComponent(postId)+'/approve',{method:'POST'})}
export async function queueAdminMarketingPosts(){return request('/api/v1/admin/marketing/posts/queue-due',{method:'POST'})}

export const customerApi={
 health:()=>request('/api/v1/health'),
 catalog:getPublicCatalog,
 product:getPublicProduct,
 categories:getCatalogCategories,
 login:loginCustomer,
 register:registerCustomer,
 logout:logoutCustomer,
 me:()=>request('/api/v1/customer/me'),
 quotes:()=>request('/api/v1/customer/quotes'),
 quote:(quoteId)=>request(`/api/v1/customer/quotes/${encodeURIComponent(quoteId)}`),
 createQuote:(payload)=>request('/api/v1/customer/quotes',{method:'POST',body:JSON.stringify(payload)}),
 createPublicQuote:(payload)=>request('/api/v1/quote-requests',{method:'POST',body:JSON.stringify(payload)}),
 createCustomerQuoteWithFile,
 orders:()=>request('/api/v1/customer/orders'),
 order:(orderId)=>request(`/api/v1/customer/orders/${encodeURIComponent(orderId)}`),
 createOrder:(payload)=>request('/api/v1/customer/orders',{method:'POST',body:JSON.stringify(payload)}),
 createPaymentSession:(orderId)=>request(`/api/v1/customer/orders/${encodeURIComponent(orderId)}/payment-session`,{method:'POST'}),
 getProofs:async()=>{const data=await request('/api/v1/customer/proofs');const p=data?.proofs;return Array.isArray(p)?p:(Array.isArray(data)?data:[])},
 acceptQuote:(quoteId)=>request(`/api/v1/customer/quotes/${encodeURIComponent(quoteId)}/accept`,{method:'POST'}),
 declineQuote:(quoteId)=>request(`/api/v1/customer/quotes/${encodeURIComponent(quoteId)}/decline`,{method:'POST'}),
 proofAction:(proofId,action,comment)=>{const path=action==='approve'?'approve':action==='request-changes'?'request-changes':'';if(!path)throw new Error('Unknown proof action.');return request(`/api/v1/customer/proofs/${encodeURIComponent(proofId)}/${path}`,{method:'POST',body:JSON.stringify({comment:comment||''})})},
 proofFile:(proofId)=>requestBlob(`/api/v1/customer/proofs/${encodeURIComponent(proofId)}/file`),
 generateCad:generateCustomerCad,
 cadJobs:getCustomerCadJobs,
 analyzeCadReference:analyzeCustomerCadReference,
 cadCapabilities:getCustomerCadCapabilities,
 cadPrinters:getCustomerCadPrinters,
 preflightCad:preflightCustomerCad,
 reviseCad:reviseCustomerCad
}
export {API_BASE,AUTH_TOKEN_KEY}
