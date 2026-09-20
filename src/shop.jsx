import React,{useEffect,useState} from 'react'
import {ArrowRight,Box,Search,ShoppingCart} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {readCart,cartCount} from './cart.js'
import {getPublicCatalog,getCatalogCategories,catalogImageUrl} from './api.js'
import './styles.css'

function App(){
 const [category,setCategory]=useState('All'),[search,setSearch]=useState(''),[products,setProducts]=useState([]),[categories,setCategories]=useState(['All']),[loading,setLoading]=useState(true),[error,setError]=useState(''),[categoryError,setCategoryError]=useState(''),cart=readCart(),count=cartCount(cart)
 useEffect(()=>{let cancelled=false
   Promise.allSettled([getPublicCatalog(),getCatalogCategories()]).then(results=>{
    if(cancelled)return
    const catalogResult=results[0],categoryResult=results[1]
    if(catalogResult.status==='fulfilled'){
      setProducts(catalogResult.value)
      setError('')
    }else{
      setError(catalogResult.reason?.message||'Unable to load the Fabvex collection.')
    }
    if(categoryResult.status==='fulfilled'){
      setCategories(['All',...categoryResult.value.filter(c=>c!=='All')])
      setCategoryError('')
    }else{
      setCategories(['All'])
      setCategoryError('Categories are temporarily unavailable. You can still browse the collection.')
    }
   }).finally(()=>{if(!cancelled)setLoading(false)})
   return()=>{cancelled=true}
 },[])
 const list=products.filter(p=>(category==='All'||p.category===category)&&(`${p.name} ${p.description||''} ${p.category||''}`.toLowerCase().includes(search.toLowerCase().trim())))
 return <div className="shop-page"><header><a className="shop-brand" href="/">FABVEX</a><nav><a href="/">Home</a><a href="/custom-work.html">Custom Work</a><a href="/checkout.html">Cart {count?`(${count})`:''}</a></nav><a className="shop-cart" href="/checkout.html" aria-label={`Shopping cart, ${count} items`}><ShoppingCart size={19}/>{count>0&&<span>{count}</span>}</a></header><main><section className="shop-hero"><p className="eyebrow">THE COLLECTION</p><h1>Things worth <em>printing.</em></h1><p>Useful, made-to-order projects designed for desks, homes, and everyday setups.</p></section>{error?<div className="no-results"><h2>Collection unavailable.</h2><p>{error}</p><button className="button secondary" onClick={()=>window.location.reload()}>Try again</button></div>:<><div className="shop-controls"><label><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects..." aria-label="Search projects"/></label><div>{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>{categoryError&&<p className="no-results" role="status">{categoryError}</p>}{loading?<div className="no-results"><h2>Loading the collection…</h2><p>Checking what is currently available.</p></div>:list.length?<div className="catalog">{list.map(p=><article key={p.id}><a href={`/product.html?id=${encodeURIComponent(p.id)}`} className="catalog-visual">{p.images?.length?<img src={catalogImageUrl(p.images.find(i=>i.is_primary)||p.images[0])} alt={p.name}/> :<div><Box size={64}/></div>}<span>{p.storefront?.origin==='customer_custom'?'CUSTOM':p.tag||'Made to Order'}</span></a><div className="catalog-info"><div><small>{p.category}</small><h2>{p.name}</h2><p>{p.description}</p></div><strong>${Number(p.price||0).toFixed(2)}</strong></div><a className="catalog-link" href={`/product.html?id=${encodeURIComponent(p.id)}`}>Configure <ArrowRight size={15}/></a></article>)}</div>:<div className="no-results"><h2>No projects found.</h2><p>{products.length?'Try another search or category.':'New projects will appear here as they are approved for the collection.'}</p></div>}</>}</main></div>}
createRoot(document.getElementById('shop-root')).render(<App/>)
