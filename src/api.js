const API_BASE=import.meta.env.VITE_API_URL||import.meta.env.VITE_API_BASE_URL||'http://127.0.0.1:8000'

async function request(path,options={}){
 const response=await fetch(`${API_BASE}${path}`,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options})
 let data=null
 try{data=await response.json()}catch(_){data=null}
 if(!response.ok)throw new Error((data&&data.error)||`API request failed: ${response.status}`)
 return data
}

export async function getPublicCatalog(params={}){
 const search=new URLSearchParams()
 if(params.q)search.set('q',params.q)
 if(params.category&&params.category!=='All')search.set('category',params.category)
 if(params.sort)search.set('sort',params.sort)
 if(params.desc)search.set('desc','1')
 const suffix=search.toString()?`?${search.toString()}`:''
 const data=await request(`/api/v1/catalog${suffix}`)
 return data.products||[]
}

export async function getPublicProduct(productId){
 const data=await request(`/api/v1/catalog/${encodeURIComponent(productId)}`)
 return data
}

export async function getCatalogCategories(){
 const data=await request('/api/v1/catalog/categories')
 return data.categories||[]
}

export const customerApi={
 health:()=>request('/api/v1/health'),
 catalog:getPublicCatalog,
 product:getPublicProduct,
 categories:getCatalogCategories,
 createQuote:(payload)=>request('/api/v1/customer/quotes',{method:'POST',body:JSON.stringify(payload)}),
 createOrder:(payload)=>request('/api/v1/customer/orders',{method:'POST',body:JSON.stringify(payload)})
}

export {API_BASE}
