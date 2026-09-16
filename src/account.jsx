import React,{useMemo,useState} from 'react'
import {ArrowLeft,ArrowRight,Box,Check,Package,UserRound} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {readCustomer,saveCustomer} from './customer-store.js'
import {readOrders} from './order-store.js'
import './styles.css'

function App(){
 const existing=useMemo(()=>readCustomer(),[])
 const [form,setForm]=useState({name:existing?.name||'',email:existing?.email||''})
 const [saved,setSaved]=useState(Boolean(existing))
 const orders=readOrders()
 const update=(key,value)=>{setSaved(false);setForm(v=>({...v,[key]:value}))}
 const submit=e=>{e.preventDefault();saveCustomer(form);setSaved(true)}
 return <div className="account-shell"><header className="account-nav"><a className="account-brand" href="/"><Box size={18}/> FAB<span>OS</span></a><nav><a href="/shop.html">Shop</a><a href="/custom-work.html">Custom Work</a><a href="/orders.html">My orders</a></nav></header><main className="account-main"><a className="account-back" href="/"><ArrowLeft size={16}/> Back to home</a><section className="account-hero"><div><p className="eyebrow">MY ACCOUNT</p><h1>Your details,<br/><em>kept simple.</em></h1><p>Save your name and email on this device so future orders can start with less typing.</p></div><div className="account-icon"><UserRound size={30}/></div></section><div className="account-grid"><section className="account-panel"><div className="panel-heading"><div><span className="eyebrow">PROFILE</span><h2>Customer details</h2></div><UserRound size={20}/></div><form onSubmit={submit}><label>Full name<input required value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Your name"/></label><label>Email<input required type="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder="you@example.com"/></label><button className="button primary" type="submit">Save details <ArrowRight size={17}/></button>{saved&&<p className="account-saved"><Check size={16}/> Saved on this device.</p>}</form><p className="account-note">This is a local customer profile for the current prototype. It is not a sign-in system, and it does not create an online account yet.</p></section><section className="account-panel"><div className="panel-heading"><div><span className="eyebrow">ORDER HISTORY</span><h2>{orders.length} {orders.length===1?'order':'orders'}</h2></div><Package size={20}/></div>{orders.length?<><p>Your orders placed on this device are ready to view.</p><a className="button secondary" href="/orders.html">View my orders <ArrowRight size={17}/></a></>:<div className="account-empty"><Package size={26}/><p>No orders yet.</p><a href="/shop.html">Browse projects</a></div>}</section></div></main></div>
}
createRoot(document.getElementById('account-root')).render(<App/>)
