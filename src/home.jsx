import React,{useEffect,useState} from 'react'
import {ArrowDownRight,ArrowRight,Box,Check,CircleDot,LogIn,Menu,Move3d,ShoppingCart,Sun,Moon,X} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {cartCount,readCart} from './cart.js'
import {getPublicCatalog,catalogImageUrl} from './api.js'
import {getTheme,setTheme} from './theme.js'
import './styles.css'
import './home-redesign.css'

function Header(){
 const [open,setOpen]=useState(false),[theme,setThemeState]=useState(getTheme())
 const count=cartCount(readCart())
 const toggleTheme=()=>{const next=theme==='dark'?'light':'dark';setTheme(next);setThemeState(next)}
 return <header className="nv2">
  <a className="brand nv2-brand" href="/"><span className="brand-mark"><img src="/brand/fabvex-mark.svg" alt=""/></span><span>FAB<span>VEX</span></span></a>
  <nav className={open?'nv2-links open':'nv2-links'}>
   <a href="#services" onClick={()=>setOpen(false)}>Services</a>
   <a href="/shop.html" onClick={()=>setOpen(false)}>Products</a>
   <a href="/custom-work.html" onClick={()=>setOpen(false)}>Custom Work</a>
   <a href="#process" onClick={()=>setOpen(false)}>How It Works</a>
   <a href="/about.html" onClick={()=>setOpen(false)}>About</a>
  </nav>
  <div className="nv2-actions">
   <a className="nv2-login" href="/account.html"><LogIn size={16}/> Log In</a>
   <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark and light mode">{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>
   <a className="nv2-cart" href="/checkout.html" aria-label={'Shopping cart, '+count+' items'}><ShoppingCart size={18}/>{count>0&&<span>{count}</span>}</a>
   <button className="nv2-menu" onClick={()=>setOpen(v=>!v)} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button>
  </div>
 </header>
}

function Capability({icon:Icon,title,copy}){return <div className="capability"><span className="cap-icon"><Icon size={17}/></span><div><strong>{title}</strong><small>{copy}</small></div></div>}

function App(){
 const [products,setProducts]=useState([])
 useEffect(()=>{getPublicCatalog().then(items=>setProducts(items.slice(0,4))).catch(()=>{})},[])
 return <div className="nv2-shell">
  <Header/>
  <main>
   <section className="nv2-hero">
    <div className="nv2-hero-copy">
     <p className="nv2-eyebrow">FABVEX · 3D PRINTING & DESIGN SOLUTIONS</p>
     <h1>Ideas, engineered<br/><em>into reality.</em></h1>
     <p className="nv2-lead">From custom designs and functional parts to prototypes and ready-to-print products, FABVEX turns digital ideas into useful, physical things.</p>
     <div className="nv2-hero-actions">
      <a className="nv2-button nv2-primary" href="/custom-work.html">Start a Project <ArrowRight size={17}/></a>
      <a className="nv2-button nv2-secondary" href="/shop.html">Explore Products</a>
     </div>
     <div className="nv2-proof"><span><Check size={14}/> Made to order</span><span><Check size={14}/> Quality checked</span><span><Check size={14}/> Custom designs welcome</span></div>
    </div>
    <div className="nv2-hero-visual" aria-label="FABVEX engineered part concept">
     <div className="nv2-tech-corner top-left"><span>FVX / 001</span><b>ENGINEERED OBJECT</b></div>
     <div className="nv2-tech-corner top-right"><span>01—05</span><b>DESIGN / PRINT</b></div>
     <div className="nv2-gridline grid-a"/><div className="nv2-gridline grid-b"/>
     <div className="nv2-orbit orbit-a"/><div className="nv2-orbit orbit-b"/>
     <div className="nv2-part"><Move3d size={118}/><span>FABVEX<br/><b>PRECISION PRINT</b></span></div>
     <div className="nv2-readout"><small>BUILD STATUS</small><strong>READY / 03</strong><i/></div>
     <div className="nv2-dimensions"><span>120.0 mm</span><i/><span>Ø 84.5</span></div>
     <div className="nv2-accent-line"/>
    </div>
   </section>

   <section className="nv2-capability-strip">
    <Capability icon={Move3d} title="Custom Parts" copy="Built around your need"/>
    <Capability icon={Box} title="Prototypes" copy="Test before production"/>
    <Capability icon={ShoppingCart} title="Ready-to-Print" copy="Shop proven designs"/>
    <Capability icon={CircleDot} title="Small Batches" copy="From one to production runs"/>
    <Capability icon={LogIn} title="Customer Portal" copy="Quotes, files & orders"/>
   </section>

   <section className="nv2-services" id="services">
    <div className="nv2-section-head wide">
     <p className="nv2-eyebrow">WHAT FABVEX DOES</p>
     <h2>More than <em>3D printing.</em></h2>
     <p>The printer is the tool. The real service is helping you get from an idea to a part that actually works.</p>
    </div>
    <div className="nv2-service-layout">
     <div className="nv2-service-feature">
      <div className="service-number">01 / CORE SERVICE</div>
      <div className="service-icon"><Move3d size={34}/></div>
      <h3>Functional & End-Use Parts</h3>
      <p>Brackets, mounts, enclosures, replacement parts, fixtures, organizers, and other useful components designed for the job they're meant to do.</p>
      <a href="/custom-work.html">Build a functional part <ArrowRight size={16}/></a>
     </div>
     <div className="nv2-service-list">
      <div><span>02</span><div><h3>Custom Design & File Prep</h3><p>Start with a model, drawing, photo, dimensions, or just an idea.</p></div></div>
      <div><span>03</span><div><h3>Prototypes & Product Development</h3><p>Iterate, proof, and verify before committing to a larger run.</p></div></div>
      <div><span>04</span><div><h3>Custom Orders & Small Batches</h3><p>One piece is fine. A repeatable production run is fine too.</p></div></div>
      <div><span>05</span><div><h3>Material & Finish Choices</h3><p>Choose based on appearance, flexibility, strength, temperature, and use.</p></div></div>
     </div>
    </div>
   </section>

   <section className="nv2-catalog-preview">
    <div className="nv2-section-head catalog-head">
     <div><p className="nv2-eyebrow">READY TO PRINT</p><h2>Useful things,<br/><em>already figured out.</em></h2></div>
     <a className="nv2-outline-link" href="/shop.html">View all products <ArrowRight size={16}/></a>
    </div>
    {products.length?<div className="nv2-product-row">{products.map(p=><a className="nv2-product" href={'/product.html?id='+encodeURIComponent(p.id)} key={p.id}>
      <div>{p.images?.length?<img src={catalogImageUrl(p.images.find(i=>i.is_primary)||p.images[0])} alt={p.name}/>:<Box size={54}/>}<span className="product-corner">FABVEX</span></div>
      <section><strong>{p.name}</strong><small>{p.category||'Custom 3D Print'}</small><b>{'$'+Number(p.price||0).toFixed(2)} <ArrowRight size={14}/></b></section>
     </a>)}</div>:<div className="nv2-empty">Catalog products will appear here when published.</div>}
   </section>

   <section className="nv2-custom-cta">
    <div className="custom-cta-copy">
     <p className="nv2-eyebrow">CUSTOM WORK</p>
     <h2>Have an idea that<br/><em>doesn't exist yet?</em></h2>
     <p>Send us your idea, dimensions, sketch, photo, model, or description. You don't need a perfect CAD file to get started.</p>
     <a className="nv2-button nv2-primary" href="/custom-work.html">Start a Custom Project <ArrowRight size={17}/></a>
    </div>
    <div className="nv2-cta-visual">
     <div className="blueprint-grid"/>
     <div className="blueprint-object"><Move3d size={112}/><span>DESIGN → PROOF → PRINT</span></div>
     <div className="blueprint-note">YOUR IDEA<br/><b>OUR EXPERTISE</b><br/>REAL RESULTS</div>
    </div>
   </section>

   <section className="nv2-process" id="process">
    <div className="nv2-section-head"><p className="nv2-eyebrow">THE FABVEX WORKFLOW</p><h2>From idea to <em>delivery.</em></h2></div>
    <div className="nv2-process-line">
     {[
      ['01','Idea','Tell us what you need. A file, photo, sketch, dimensions, or description.'],
      ['02','Design','We review the job and create or refine the model when needed.'],
      ['03','Proof','You review and approve the design before production when a proof is required.'],
      ['04','Print','We turn the approved design into a finished part with quality checks.'],
      ['05','Deliver','Packed carefully and sent to you, ready for real-world use.']
     ].map(([n,t,d])=><div key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}
    </div>
   </section>

   <section className="nv2-final-cta">
    <div><p className="nv2-eyebrow">ENGINEERED FOR REAL-WORLD IDEAS</p><h2>Got an idea?<br/><em>Let's build it.</em></h2><p>From a simple replacement part to something nobody has made before, start with what you have.</p><a className="nv2-button nv2-primary" href="/custom-work.html">Start a Project <ArrowRight size={17}/></a></div>
    <div className="final-visual"><div className="final-glow"/><Move3d size={150}/><span>FABVEX<br/><b>ENGINEERED. DESIGNED. PRINTED.</b></span></div>
   </section>
  </main>
  <footer className="nv2-footer"><div className="brand"><span className="brand-mark"><img src="/brand/fabvex-mark.svg" alt=""/></span><span>FAB<span>VEX</span></span></div><div><a href="/account.html">Customer Login</a><a href="/shop.html">Products</a><a href="/custom-work.html">Custom Work</a><a href="/about.html">About</a></div><small>© 2026 FABVEX. Built for real-world ideas.</small></footer>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>)
