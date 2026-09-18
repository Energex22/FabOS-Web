export const CUSTOMER_CONTRACT_VERSION=1

export function buildOrderPayload({cart,form,subtotal,shipping,total}){
 return {
  contractVersion:CUSTOMER_CONTRACT_VERSION,
  channel:'website',
  customer:{name:form.name.trim(),email:form.email.trim()},
  shippingAddress:{address:form.address.trim(),city:form.city.trim(),state:form.state.trim(),zip:form.zip.trim()},
  notes:form.notes.trim(),
  items:cart.map(item=>({
   productId:item.productId||item.id,
   variantId:item.id,
   name:item.name,
   unitPrice:Number(item.price),
   quantity:Number(item.quantity),
   configuration:item.configuration||null
  })),
  totals:{subtotal:Number(subtotal),shipping:Number(shipping),total:Number(total)}
 }
}

export function buildQuotePayload({data,file}){
 return {
  contractVersion:CUSTOMER_CONTRACT_VERSION,
  channel:'website',
  customer:{name:data.name.trim(),email:data.email.trim()},
  project:{
   idea:data.idea.trim(),
   dimensions:data.dimensions.trim(),
   material:data.material.trim(),
   quantity:Number(data.quantity)||1,
   notes:data.notes.trim()
  },
  file:file?{name:file.name,type:file.type||'application/octet-stream',size:file.size}:null
 }
}
