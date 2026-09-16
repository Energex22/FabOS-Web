import React, { useMemo, useState } from 'react'
import { ArrowLeft, Box, Check, Minus, Plus, ShoppingCart, X } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const products={
  dock:{id:'dock',name:'Desk Cable Dock',price:18,tag:'Best Seller',category:'Desk & Office',description:'A clean, compact home for the cables that never stay put.'},
  stand:{id:'stand',name:'Controller Stand',price:24,tag:'Popular',category:'Gaming',description:'Weighted, low-profile support built for everyday use.'},
  hook:{id:'hook',name:'Headphone Hook',price:16,tag:'New',category:'Desk & Office',description:'A simple under-desk mount that keeps your setup clear.'},
  organizer:{id:'organizer',name:'Modular Home Organizer',price:32,tag:'Popular',category:'Home',description:'Stackable storage designed around the things you actually own.'},
  mount:{id:'mount',name:'Utility Mount',price:21,tag:'Made to Order',category:'Home',description:'A compact mounting solution for awkward spaces.'},
  gaming:{id:'gaming',name:'Gaming Desk Dock',price:29,tag:'New',category:'Gaming',description:'Keep controllers, cables, and accessories within reach.'}
}
const materials={PLA:{price:0,note:'Simple, rigid, and ideal for everyday indoor parts.'},PETG:{price:3,note:'Tougher and more heat-resistant for practical parts.'},TPU:{price:6,note:'Flexible material for grips, feet, and parts that need give.'}}
const colors=['Black','White','Gray','Red','Blue','Natural']

function getProduct(){
 const id=new URLSearchParams(window.location.search).get('id')||'dock'
 return products[id]||products.dock
}

function App(){
 const product=getProduct()
 const [quantity,setQuantity]=useState(1)
 const [material,setMaterial]=useState('PLA')
 const [color,setColor]=useState('Black')
 const [added,setAdded]=useState(false)
 const [cartOpen,setCartOpen]=useState(false)
 const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('fabos.cart')||'[]')}catch{return[]}})
 const price=useMemo(()=>product.price+materials[material].price,[product.price,material])
 const total=price*quantity
 const count=cart.reduce((n,item)=>n+item.quantity,0)
 const addToCart=()=>{
  const id=`${product.id}-${material}-${color}`
  const next=cart.some(item=>item.id===id)?cart.map(item=>item.id===id?{...item,quantity:item.quantity+quantity}:{...item}):[...cart,{...product,id,name:`${product.name} · ${material} · ${color}`,price,quantity}]
  setCart(next);localStorage.setItem('fabos.cart',JSON.stringify(next));setAdded(true)
 }
 const change=(id,delta)=>{
  const next=cart.flatMap(item=>item.id!==id?[item]:item.quantity+delta>0?[{...item,quantity:item.quantity+delta}]:[])
  setCart(next);localStorage.setItem('fabos.cart',JSON.stringify(next))
 }
 return <div className="product-shell">
  <header className="product-nav"><a className="product-brand" href="/">FAB<span>OS</span></a><button className="product-cart" onClick={()=>setCartOpen(true)} aria-label={`Shopping cart, ${count} items`}><ShoppingCart size={19}/>{count>0&&<span>{count}</span>}</button></header>
  <main className="product-main">
   <a className="back-link" href="/"><ArrowLeft size={16}/> Back to shop</a>
   <div className="product-layout">
    <section className="product-stage"><div className="product-stage-ring ring-a"/><div className="product-stage-ring ring-b"/><div className="product-stage-object"><Box size={118}/></div><span>{product.tag}</span></section>
    <section className="product-config"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="product-description">{product.description}</p><div className="base-price">From <strong>${product.price}</strong></div>
     <div className="config-block"><label>Material</label><div className="option-grid">{Object.entries(materials).map(([name,info])=><button key={name} className={material===name?'selected':''} onClick={()=>setMaterial(name)}><strong>{name}</strong><span>{info.price?`+$${info.price}`:'Included'}</span></button>)}</div><p className="option-note">{materials[material].note}</p></div>
     <div className="config-block"><label>Color</label><div className="color-grid">{colors.map(name=><button key={name} className={color===name?'selected':''} onClick={()=>setColor(name)}>{name}</button>)}</div></div>
     <div className="config-block"><label>Quantity</label><div className="quantity-control"><button onClick={()=>setQuantity(q=>Math.max(1,q-1))} aria-label="Decrease quantity"><Minus size={17}/></button><strong>{quantity}</strong><button onClick={()=>setQuantity(q=>q+1)} aria-label="Increase quantity"><Plus size={17}/></button></div></div>
     <div className="purchase-row"><div><small>CONFIGURED TOTAL</small><strong>${total}</strong></div><button className="button primary" onClick={addToCart}>{added?<><Check size={17}/> Added to cart</>:<>Add to cart <Plus size={17}/></>}</button></div>
     <p className="made-note">Made to order. Final material, color, and production options can be expanded as the catalog grows.</p>
    </section>
   </div>
  </main>
  {cartOpen&&<div className="product-cart-overlay" onClick={()=>setCartOpen(false)}><aside className="product-cart-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">YOUR CART</p><h2>{count} {count===1?'item':'items'}</h2></div><button onClick={()=>setCartOpen(false)} aria-label="Close cart"><X/></button></div>{cart.length?<><div className="drawer-items">{cart.map(item=><div className="drawer-item" key={item.id}><div><strong>{item.name}</strong><span>${item.price} each</span></div><div className="drawer-qty"><button onClick={()=>change(item.id,-1)}><Minus size={14}/></button><span>{item.quantity}</span><button onClick={()=>change(item.id,1)}><Plus size={14}/></button></div></div>)}</div><div className="drawer-total"><span>Subtotal</span><strong>${cart.reduce((n,item)=>n+item.price*item.quantity,0)}</strong></div><button className="button primary full">Checkout <ArrowLeft size={16} style={{transform:'rotate(180deg)'}}/></button><p className="checkout-note">Checkout will connect to the customer order system when the API is enabled.</p></>:<div className="empty-cart"><ShoppingCart size={28}/><p>Your cart is empty.</p><button className="button secondary" onClick={()=>setCartOpen(false)}>Continue shopping</button></div>}</aside></div>}
 </div>
}

createRoot(document.getElementById('product-root')).render(<App />)
