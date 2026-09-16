import React,{useEffect,useState} from 'react'
import {ArrowLeft,ArrowRight,Box,Check,Minus,Plus,ShoppingCart} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {readCart,writeCart,cartCount,changeCartItem} from './cart.js'
import {customerApi,AUTH_TOKEN_KEY} from './api.js'
import './styles.css'

function App(){
 const token=typeof localStorage!=='undefined'?localStorage.getItem(AUTH_TOKEN_KEY):''
 const customer=typeof localStorage!=='undefined'?JSON.parse(localStorage.getItem('fabos.customer')||'null'):null
 const [cart,setCart]=useState(readCart),[submitted,setSubmitted]=useState(null),[estimate,setEstimate]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(Boolean(token)),[profileLoading,setProfileLoading]=useState(Boolean(token))
 const [form,setForm]=useState({name:customer?.name||'',email:customer?.email||'',address:'',city:'',state:'',zip:'',notes:''})
 const count=cartCount(cart)
 const updateCart=next=>{setCart(next);writeCart(next);setEstimate(null);setError('')}
 const update=(key,value)=>setForm(v=>({...v,[key]:value}))
 useEffect(()=>{
  if(!token){window.location.href='/account.html?return=checkout';return}
  customerApi.me().then(result=>{
   const c=result?.customer||{},u=result?.user||{}
   const next={name:c.name||u.name||'',email:c.email||u.email||'',address:'',city:'',state:'',zip:'',notes:''}
   setForm(v=>({...next,address:v.address,city:v.city,state:v.state,zip:v.zip,notes:v.notes}))
   if(typeof localStorage!=='undefined')localStorage.setItem('fabos.customer',JSON.stringify({name:next.name,email:next.email}))
  }).catch(()=>{}).finally(()=>setProfileLoading(false))
 },[token])
 useEffect(()=>{
  if(!token||!cart.length){setLoading(false);return}
  let cancelled=false
  setLoading(true);setError('')
  customerApi.checkoutEstimate(cart.map(item=>({product_id:item.productId||item.id,quantity:Number(item.quantity)||1}))).then(result=>{if(!cancelled)setEstimate(result)}).catch(err=>{if(!cancelled)setError(err.message)}).finally(()=>{if(!cancelled)setLoading(false)})
  return()=>{cancelled=true}
 },[cart,token])
 const subtotal=((estimate?.subtotal_cents||0)/100).toFixed(2)
 const shipping=((estimate?.shipping_cents||0)/100).toFixed(2)
 const total=((estimate?.total_cents||0)/100).toFixed(2)
 const submit=async e=>{
  e.preventDefault();if(!cart.length||!estimate||loading||profileLoading)return
  setLoading(true);setError('')
  try{
   const result=await customerApi.createOrder({items:cart.map(item=>({product_id:item.productId||item.id,quantity:Number(item.quantity)||1})),shipping_address:{name:form.name,address:form.address,city:form.city,state:form.state,zip:form.zip},notes:form.notes.trim(),shipping_mode:estimate.shipping_mode||'calculated'})
   const order=result?.order||{}
   setSubmitted({orderNumber:order.order_number||order.orderNumber||'—',items:cart,totals:{total_cents:Number(order.total_cents||0)}})
   writeCart([]);setCart([])
  }catch(err){setError(err.message||'We could not place the order. Please try again.')}finally{setLoading(false)}
 }
 if(!token)return <div className="checkout-shell"><main className="checkout-success"><p className="eyebrow">CHECKOUT</p><h1>Opening your account…</h1></main></div>
 if(submitted)return <div className="checkout-shell"><header className="checkout-nav"><a href="/" className="checkout-brand"><Box size={18}/> STOREFRONT</a></header><main className="checkout-success"><div className="success-mark"><Check size={34}/></div><p className="eyebrow">ORDER RECEIVED</p><h1>Your order is in.</h1><p>Your order was created by the FabOS backend. Payment processing can be connected separately without changing the catalog or order workflow.</p><div className="checkout-order-reference"><span>ORDER NUMBER</span><strong>{submitted.orderNumber}</strong><small>{submitted.items.length} {submitted.items.length===1?'item':'items'} · ${(submitted.totals.total_cents/100).toFixed(2)} total</small></div><div className="checkout-success-actions"><a className="button primary" href="/orders.html">View your orders <ArrowRight size={17}/></a><a className="button secondary" href="/shop.html">Continue shopping</a></div><p className="checkout-powered">Powered by FabOS</p></main></div>
 return <div className="checkout-shell"><header className="checkout-nav"><a href="/" className="checkout-brand"><Box size={18}/> STOREFRONT</a><div className="checkout-nav-links"><a href="/account.html">My account</a><a href="/orders.html">My orders</a><span className="checkout-secure">CHECKOUT</span></div></header><main className="checkout-main"><a className="back-link" href="/shop.html"><ArrowLeft size={16}/> Continue shopping</a><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><p className="eyebrow">CUSTOMER DETAILS</p><h1>Complete your order.</h1><p className="checkout-intro">Your account is required for checkout. Product, quantity, tax, and calculated shipping are validated by the FabOS backend.</p><section><h2>Contact</h2><div className="field-grid"><label>Full name<input required value={form.name} disabled={profileLoading} onChange={e=>update('name',e.target.value)}/></label><label>Email<input required type="email" value={form.email} disabled={profileLoading} onChange={e=>update('email',e.target.value)}/></label></div></section><section><h2>Shipping address</h2><label>Street address<input required value={form.address} onChange={e=>update('address',e.target.value)}/></label><div className="field-grid three"><label>City<input required value={form.city} onChange={e=>update('city',e.target.value)}/></label><label>State<input required value={form.state} onChange={e=>update('state',e.target.value)}/></label><label>ZIP code<input required value={form.zip} onChange={e=>update('zip',e.target.value)}/></label></div></section><section><h2>Order notes <span>Optional</span></h2><textarea value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="Anything we should know about your order?"/></section>{error&&<p className="account-error">{error}</p>}<button className="button primary checkout-submit" disabled={!cart.length||!estimate||loading||profileLoading}>{loading?'Preparing order…':<>Place order <ArrowRight size={17}/></>}</button><p className="checkout-disclaimer">Payment will be added as a separate Stripe or Square checkout step.</p></form><aside className="order-summary"><div className="summary-head"><div><p className="eyebrow">YOUR ORDER</p><h2>{count} {count===1?'item':'items'}</h2></div><ShoppingCart size={20}/></div>{cart.length?<><div className="summary-items">{cart.map(item=><div className="summary-item" key={item.id}><div><strong>{item.name}</strong><small>${Number(item.price||0).toFixed(2)} each</small></div><div className="summary-qty"><button type="button" onClick={()=>updateCart(changeCartItem(cart,item.id,-1))}><Minus size={13}/></button><span>{item.quantity}</span><button type="button" onClick={()=>updateCart(changeCartItem(cart,item.id,1))}><Plus size={13}/></button></div></div>)}</div><div className="summary-lines"><div><span>Subtotal</span><strong>${subtotal}</strong></div><div><span>Tax{estimate?.tax_percent?` (${estimate.tax_percent}%)`:''}</span><strong>${((estimate?.tax_cents||0)/100).toFixed(2)}</strong></div><div><span>Shipping</span><strong>{Number(shipping)?'$'+shipping:'Calculated'}</strong></div><div className="summary-total"><span>Total</span><strong>${total}</strong></div></div></>:<div className="summary-empty"><ShoppingCart size={28}/><p>Your cart is empty.</p><a href="/shop.html">Browse projects</a></div>}</aside></div></main><footer className="checkout-powered">Powered by FabOS</footer></div>
}
createRoot(document.getElementById('checkout-root')).render(<App/>)
