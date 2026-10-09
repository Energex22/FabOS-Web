import React,{useEffect,useState} from 'react'
import {ArrowLeft,ArrowRight,Check,Minus,Plus,ShoppingCart} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {NotificationBell} from './notifications-ui.jsx'
import {readCart,writeCart,cartCount,changeCartItem} from './cart.js'
import {customerApi,parseTotals,AUTH_TOKEN_KEY} from './api.js'
import {handleUnauthorized} from './auth.js'
import {formatCents,formatDollars} from './money.js'
import './styles.css'

function savedCustomer(){
 if(typeof localStorage==='undefined')return null
 try{const value=JSON.parse(localStorage.getItem('fabos.customer')||'null');return value&&typeof value==='object'?value:null}catch{return null}
}

function App(){
 const token=typeof localStorage!=='undefined'?localStorage.getItem(AUTH_TOKEN_KEY):''
 const customer=savedCustomer()
 const [cart,setCart]=useState(readCart),[submitted,setSubmitted]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[profileLoading,setProfileLoading]=useState(Boolean(token))
 const [form,setForm]=useState({name:customer?.name||'',email:customer?.email||'',address:'',city:'',state:'',zip:'',notes:''})
 // Phase 3: binding totals preview from the server. Never rendered from local
 // math; the preview total is what the order will cost (items + tax + shipping).
 const [preview,setPreview]=useState(null),[previewLoading,setPreviewLoading]=useState(false),[previewError,setPreviewError]=useState('')
 const count=cartCount(cart)
 const subtotal=cart.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||0),0)
 // Digital products need no shipping address and are never charged shipping;
 // the backend skips address validation when every line item is digital.
 const allDigital=cart.length>0&&cart.every(item=>item.isDigital)
 const updateCart=next=>{setCart(next);writeCart(next);setError('')}
 const update=(key,value)=>setForm(v=>({...v,[key]:value}))
 useEffect(()=>{
  if(!token){window.location.href='/account.html?return='+encodeURIComponent('/checkout.html');return}
  customerApi.me().then(result=>{
   const c=result?.customer||{},u=result?.user||{}
   const next={name:c.name||u.name||'',email:c.email||u.email||''}
   setForm(v=>({...v,...next}))
   if(typeof localStorage!=='undefined')localStorage.setItem('fabos.customer',JSON.stringify(next))
  }).catch(err=>{if(err?.status===401)handleUnauthorized()}).finally(()=>setProfileLoading(false))
 },[token])
 const orderPayload=()=>({items:cart.map(item=>({productId:item.productId||item.id,variantId:item.variantId||null,license:item.license||null,quantity:Number(item.quantity)||1,configuration:item.configuration||null})),shippingAddress:{address:form.address.trim(),city:form.city.trim(),state:form.state.trim(),zip:form.zip.trim()},notes:form.notes.trim()})
 // Tax and shipping need the destination, so the preview only runs once the
 // shipping address is filled in — unless the cart is all-digital, in which
 // case no address exists and none is needed. Debounced: one server call per pause in typing.
 const addressReady=form.address.trim()&&form.city.trim()&&form.state.trim()&&form.zip.trim()
 const previewReady=allDigital||addressReady
 useEffect(()=>{
  if(!token||!cart.length||!previewReady){setPreview(null);setPreviewError('');return}
  setPreviewLoading(true);setPreviewError('')
  const id=setTimeout(async()=>{
   try{
    const totals=parseTotals(await customerApi.orderTotalsPreview(orderPayload()))
    if(totals){setPreview(totals);setPreviewError('')}
    else{setPreview(null);setPreviewError('The server returned a total we could not read. Please try again.')}
   }catch(err){setPreview(null);setPreviewError(err?.message||'We could not calculate your total. Please try again.')}
   finally{setPreviewLoading(false)}
  },450)
  return()=>clearTimeout(id)
 },[token,previewReady,JSON.stringify(cart.map(i=>[i.productId||i.id,i.variantId,i.license,i.quantity,i.price]))])
 const submit=async e=>{
  e.preventDefault();if(!cart.length||loading||profileLoading||!preview||previewLoading)return
  setLoading(true);setError('')
  try{
   const result=await customerApi.createOrder(orderPayload())
   const order=result?.order||{},totals=parseTotals(result)
   let payment=null
   try{payment=(await customerApi.createPaymentSession(order.id))?.payment||null}catch(paymentError){payment={status:'error',message:paymentError.message||'Payment setup could not be initialized.'}}
   setSubmitted({orderNumber:order.order_number||'—',id:order.id,items:cart,totalCents:totals?.totalCents??null,payment})
   writeCart([]);setCart([]);setPreview(null)
  }catch(err){setError(err.message||'We could not place the order. Please try again.')}finally{setLoading(false)}
 }
 if(!token)return <div className="checkout-shell"><main className="checkout-success"><p className="eyebrow">CHECKOUT</p><h1>Opening your account…</h1></main></div>
 if(submitted)return <div className="checkout-shell"><header className="checkout-nav"><a href="/" className="checkout-brand"><img className="brand-inline-mark" src="/brand/fabvex-mark.svg" alt="" /> FABVEX</a></header><main className="checkout-success"><div className="success-mark"><Check size={34}/></div><p className="eyebrow">ORDER RECEIVED</p><h1>Your order is in.</h1><p>Your order has been received and the payment step is connected through our secure payment system.</p>{submitted.payment?.status==='error'&&<p className="checkout-payment-note">Your order was recorded, but we couldn't open the payment step. You can retry payment from your order details.</p>}{submitted.payment?.checkout_url&&<a className="button primary" href={submitted.payment.checkout_url}>Continue to payment <ArrowRight size={17}/></a>}{submitted.items?.some(i=>i.isDigital)&&<p className="checkout-payment-note">Your download links will appear in <a href="/account.html">My downloads</a> as soon as payment clears.</p>}{submitted.totalCents!=null&&<div className="checkout-order-reference"><span>ORDER TOTAL</span><strong>{formatCents(submitted.totalCents)}</strong><small>{submitted.items.length} {submitted.items.length===1?'item':'items'} · binding total incl. tax &amp; shipping</small></div>}<div className="checkout-order-reference"><span>ORDER NUMBER</span><strong>{submitted.orderNumber}</strong></div><div className="checkout-success-actions"><a className="button secondary" href={submitted.id?`/order.html?id=${encodeURIComponent(submitted.id)}`:'/orders.html'}>View order <ArrowRight size={17}/></a><a className="button secondary" href="/shop.html">Continue shopping</a></div></main></div>
 const submitDisabled=!cart.length||loading||profileLoading||previewLoading||!preview
 return <div className="checkout-shell"><header className="checkout-nav"><a href="/" className="checkout-brand"><img className="brand-inline-mark" src="/brand/fabvex-mark.svg" alt="" /> FABVEX</a><div className="checkout-nav-links"><NotificationBell/><a href="/account.html">My account</a><a href="/orders.html">My orders</a><span className="checkout-secure">CHECKOUT</span></div></header><main className="checkout-main"><a className="back-link" href="/shop.html"><ArrowLeft size={16}/> Continue shopping</a><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><p className="eyebrow">CUSTOMER DETAILS</p><h1>Complete your order.</h1><p className="checkout-intro">Your account is required for checkout. The binding total below is calculated by our server — items, tax, and shipping — before you continue to payment.</p><section><h2>Contact</h2><div className="field-grid"><label>Full name<input required value={form.name} disabled={profileLoading} onChange={e=>update('name',e.target.value)}/></label><label>Email<input required type="email" value={form.email} disabled={profileLoading} onChange={e=>update('email',e.target.value)}/></label></div></section>{allDigital?<section><h2>Delivery</h2><p className="checkout-intro">Your cart is all digital downloads — no shipping address needed. Your files will be ready in <a href="/account.html">My downloads</a> as soon as payment clears.</p></section>:<section><h2>Shipping address</h2><label>Street address<input required value={form.address} onChange={e=>update('address',e.target.value)}/></label><div className="field-grid three"><label>City<input required value={form.city} onChange={e=>update('city',e.target.value)}/></label><label>State<input required value={form.state} onChange={e=>update('state',e.target.value)}/></label><label>ZIP code<input required value={form.zip} onChange={e=>update('zip',e.target.value)}/></label></div></section>}<section><h2>Order notes <span>Optional</span></h2><textarea value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="Anything we should know about your order?"/></section>{error&&<p className="account-error">{error}</p>}{previewError&&<p className="account-error">{previewError}</p>}<div className="binding-total" aria-live="polite"><div><span className="eyebrow">BINDING TOTAL</span>{preview?<><strong>{formatCents(preview.totalCents)}</strong><small>This exact amount — items, tax, and shipping — is what you'll pay.</small></>:previewLoading?<><strong>Calculating…</strong><small>Fetching your exact total from our server.</small></>:<><strong>—</strong><small>{cart.length?(previewReady?'Your total will appear here.':'Fill in your shipping address to see your exact total.'):'Your cart is empty.'}</small></>}</div></div><button className="button primary checkout-submit" disabled={submitDisabled}>{loading?'Starting your order…':<>Continue to payment <ArrowRight size={17}/></>}</button><p className="checkout-disclaimer">Payment is handled securely through our payment system.</p></form><aside className="order-summary"><div className="summary-head"><div><p className="eyebrow">YOUR ORDER</p><h2>{count} {count===1?'item':'items'}</h2></div><ShoppingCart size={20}/></div>{cart.length?<><div className="summary-items">{cart.map(item=><div className="summary-item" key={item.id}><div><strong>{item.name}</strong><small>{formatDollars(Number(item.price||0))} each</small></div><div className="summary-qty"><button type="button" onClick={()=>updateCart(changeCartItem(cart,item.id,-1))}><Minus size={13}/></button><span>{item.quantity}</span><button type="button" onClick={()=>updateCart(changeCartItem(cart,item.id,1))}><Plus size={13}/></button></div></div>)}</div><div className="summary-lines"><div><span>Items subtotal</span><strong>{formatDollars(subtotal)}</strong></div>{preview?<><div><span>Tax</span><strong>{formatCents(preview.taxCents)}</strong></div><div><span>Shipping</span><strong>{preview.shippingCents?formatCents(preview.shippingCents):'Free'}</strong></div><div className="summary-total"><span>Binding total</span><strong>{formatCents(preview.totalCents)}</strong></div></>:<div className="summary-total"><span>Total</span><strong>{previewLoading?'Calculating…':(previewReady?'—':'Enter your address')}</strong></div>}</div></>:<div className="summary-empty"><ShoppingCart size={28}/><p>Your cart is empty.</p><a href="/shop.html">Browse projects</a></div>}</aside></div></main></div>
}
createRoot(document.getElementById('checkout-root')).render(<App/>)
