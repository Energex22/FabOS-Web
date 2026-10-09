
import React,{useEffect,useState} from 'react'
import {Brain,RefreshCw,Save,Package,Factory,Store,Settings,Activity,Download,Upload,X,Plus} from 'lucide-react'
import {getAdminCatalog,getAdminCustomers,getAdminQuotes,getAdminQuote,getAdminUsers,getAdminPermissions,getAdminSettings,getAdminInvoices,getAdminInvoice,getAdminFulfillments,getAdminFulfillment,updateAdminFulfillment,transitionAdminFulfillment,fulfillmentTransitions,fulfillmentStatusLabel,splitActionItems,getSystemHealth,updateAdminStorefront,createAdminCustomer,updateAdminQuote,updateAdminSetting,settingMetaDescription,getAdminAiStatus,sendAdminAiMessage,getAdminMarketingDashboard,getAdminMarketingProviders,getAdminMarketingPosts,approveAdminMarketingPost,queueAdminMarketingPosts,startAdminProduction,getAdminDesigns,getAdminDesign,getAdminQc,getAdminQcDetail,updateAdminQc,reconcileAdminQc,adminPrinterPreflight,adminPrinterPreheat,adminPrinterAction,getAdminProofs,getAdminQuoteProofs,createAdminProof,uploadAdminProof,sendAdminProof,draft_proof_message,getAdminOrder,extractNextStep,createAdminInvoiceFromOrder,recordAdminInvoicePayment,nextStepLabel,orderPaymentGate,getAdminDigitalConfig,updateAdminDigitalConfig,uploadAdminDigitalFiles,deleteAdminDigitalFile} from './api.js'
import {formatCents} from './money.js'
import './admin-workspaces.css'

const date=v=>v?new Date(v).toLocaleString():'—'
function Shell({kicker,title,description,onRefresh,busy,children}){return <section className="workspace"><div className="workspace-head"><div><p className="admin-kicker">{kicker}</p><h2>{title}</h2><p>{description}</p></div>{onRefresh&&<button className="admin-ghost" onClick={onRefresh} disabled={busy}><RefreshCw size={15} className={busy?'spin':''}/> Refresh</button>}</div>{children}</section>}
function Table({rows,columns,empty='Nothing to show.'}){if(!rows?.length)return <div className="workspace-empty">{empty}</div>;return <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||r.license_key||r.quote_number||r.username||i}>{columns.map(c=><td key={c.key}>{c.render?c.render(r,i):r[c.key]??'—'}</td>)}</tr>)}</tbody></table></div>}
function FieldList({fields}){return <dl className="workspace-fields">{fields.map(([label,value])=><div className="workspace-field" key={label}><dt>{label}</dt><dd>{value??'—'}</dd></div>)}</dl>}

function Catalog(){
 const [data,setData]=useState(null),[q,setQ]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[digitalFor,setDigitalFor]=useState(null)
 const load=async()=>{setBusy(true);try{setData(await getAdminCatalog(q));setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 const publish=async r=>{try{await updateAdminStorefront(r.product.id,{visibility:r.storefront?.visibility==='published'?'draft':'published'});await load()}catch(e){setError(e.message)}}
 const isDigital=r=>String(r.product?.product_type||'').toLowerCase()==='digital'
 return <Shell kicker="CATALOG" title="Products & storefront" description="Manage the catalog already backed by FabOS." onRefresh={load} busy={busy}><div className="workspace-toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products…"/><button className="admin-primary" onClick={load}>Search</button></div>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.products||[]} columns={[{key:'name',label:'Product',render:r=><div><strong>{r.product?.name||r.product?.sku||r.product?.id}</strong><small>{r.product?.sku||'No SKU'} · {r.product?.category||'Other'}{isDigital(r)&&' · Digital download'}</small></div>},{key:'price',label:'Price',render:r=>formatCents(r.product?.price_cents)},{key:'visibility',label:'Visibility',render:r=><span className="pill">{r.storefront?.visibility||'draft'}</span>},{key:'ready',label:'Readiness',render:r=>r.storefront?.ready?'Ready':'Needs work'},{key:'action',label:'Action',render:r=><div className="button-row"><button className="table-button" onClick={()=>setDigitalFor({id:r.product.id,name:r.product?.name||r.product?.sku})}><Download size={13}/> Digital</button><button className="table-button" onClick={()=>publish(r)}>{r.storefront?.visibility==='published'?'Unpublish':'Publish'}</button></div>}]}/>{digitalFor&&<DigitalSetup productId={digitalFor.id} productName={digitalFor.name} onClose={()=>setDigitalFor(null)} onSaved={load}/>}</Shell>
}

const DIGITAL_DESIGN_TYPES=[['3d_print','3D print'],['cnc','CNC'],['laser','Laser']]
const dollarsToCents=v=>{const n=Number(String(v??'').trim());return Number.isFinite(n)&&n>=0?Math.round(n*100):null}
// Digital product setup: product type + design type, license options
// (personal vs commercial pricing), and the downloadable file attachments.
// Allowed file extensions per design type are configured in Settings >
// Digital products — the upload here validates against that config.
function DigitalSetup({productId,productName,onClose,onSaved}){
 const [config,setConfig]=useState(null),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState('')
 const [productType,setProductType]=useState('digital'),[designType,setDesignType]=useState('3d_print')
 const [licenses,setLicenses]=useState([{license_key:'personal',label:'Personal use',price:'15.00',active:true},{license_key:'commercial',label:'Commercial use',price:'45.00',active:true}])
 const load=async()=>{setBusy(true);setError('');try{const data=await getAdminDigitalConfig(productId);setConfig(data);setProductType(data.product_type||'digital');setDesignType(data.design_type||'3d_print');if(Array.isArray(data.licenses)&&data.licenses.length)setLicenses(data.licenses.map(l=>({license_key:l.license_key,label:l.label,price:(Number(l.price_cents||0)/100).toFixed(2),active:l.active!==false})))}catch(e){setError(e.message||'Could not load digital settings.')}finally{setBusy(false)}}
 useEffect(()=>{load()},[productId])
 const updateLicense=(index,patch)=>setLicenses(list=>list.map((l,i)=>i===index?{...l,...patch}:l))
 const addLicense=()=>setLicenses(list=>[...list,{license_key:'',label:'',price:'',active:true}])
 const removeLicense=index=>setLicenses(list=>list.filter((_,i)=>i!==index))
 const save=async()=>{
  setSaving(true);setError('')
  try{
   const payload={product_type:productType,design_type:designType}
   if(productType==='digital'){
    payload.licenses=licenses.map((l,i)=>{
     const key=String(l.license_key||'').trim().toLowerCase()
     if(!key)throw new Error('Every license option needs a key (e.g. personal).')
     const price_cents=dollarsToCents(l.price)
     if(price_cents==null)throw new Error('License "'+key+'" needs a valid price of $0 or more.')
     return {license_key:key,label:String(l.label||key).trim(),price_cents,active:l.active!==false,sort_order:i}
    })
   }
   const data=await updateAdminDigitalConfig(productId,payload)
   setConfig(data);setProductType(data.product_type||productType);setDesignType(data.design_type||designType)
   if(onSaved)onSaved()
  }catch(e){setError(e.message||'Could not save digital settings.')}finally{setSaving(false)}
 }
 const upload=async e=>{
  const files=Array.from(e.target.files||[]);if(!files.length)return
  setUploading(true);setError('')
  try{const data=await uploadAdminDigitalFiles(productId,files);setConfig(c=>({...c,files:[...(data.files||[]),...(c?.files||[])] }));if(onSaved)onSaved()}
  catch(err){setError(err.message||'Upload failed.')}
  finally{setUploading(false);e.target.value=''}
 }
 const removeFile=async fileId=>{setError('');try{await deleteAdminDigitalFile(productId,fileId);setConfig(c=>({...c,files:(c?.files||[]).filter(f=>f.id!==fileId)}));if(onSaved)onSaved()}catch(e){setError(e.message||'Could not delete the file.')}}
 const allowedExts=(config?.allowed_extensions||[]).map(e=>'.'+e).join(', ')
 return <div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">DIGITAL PRODUCT</p><h3>{productName||productId}</h3><small>Sell downloadable files instead of printed parts.</small></div><button className="table-button" onClick={onClose}>Close</button></div>
 {error&&<div className="workspace-error">{error}</div>}
 {busy?<div className="workspace-empty">Loading digital settings…</div>:<>
 <div className="subsection"><h3>Product type</h3><div className="button-row"><button className={productType==='physical'?'admin-primary':'admin-ghost'} onClick={()=>setProductType('physical')}>Physical</button><button className={productType==='digital'?'admin-primary':'admin-ghost'} onClick={()=>setProductType('digital')}>Digital download</button></div>
 {productType==='digital'&&<div className="button-row"><span className="workspace-hint">Design type:</span>{DIGITAL_DESIGN_TYPES.map(([value,label])=><button key={value} className={designType===value?'admin-primary':'admin-ghost'} onClick={()=>setDesignType(value)}>{label}</button>)}</div>}
 {productType==='digital'&&<small className="workspace-hint">Allowed file extensions for {designType}: {allowedExts||'—'} (change in Settings → Digital products).</small>}</div>
 {productType==='digital'&&<div className="subsection"><h3>License options</h3><Table rows={licenses} columns={[{key:'license_key',label:'Key',render:(l,i)=><input className="price-input" value={l.license_key} onChange={e=>updateLicense(i,{license_key:e.target.value})} placeholder="personal"/>},{key:'label',label:'Label',render:(l,i)=><input className="price-input" value={l.label} onChange={e=>updateLicense(i,{label:e.target.value})} placeholder="Personal use"/>},{key:'price',label:'Price (USD)',render:(l,i)=><input className="price-input" type="number" min="0" step="0.01" value={l.price} onChange={e=>updateLicense(i,{price:e.target.value})}/>},{key:'active',label:'Active',render:(l,i)=><input type="checkbox" checked={l.active!==false} onChange={e=>updateLicense(i,{active:e.target.checked})}/>},{key:'remove',label:'',render:(l,i)=><button className="table-button" onClick={()=>removeLicense(i)} aria-label="Remove license"><X size={14}/></button>}]} empty="No license options — add at least one to sell this product."/><div className="button-row"><button className="admin-ghost" onClick={addLicense}><Plus size={14}/> Add license</button></div></div>}
 {productType==='digital'&&<div className="subsection"><h3>Download files</h3>{(config?.files||[]).length?<Table rows={config.files} columns={[{key:'original_name',label:'File',render:f=><div><strong>{f.original_name}</strong><small>{f.size_bytes?Math.round(Number(f.size_bytes)/1024)+' KB':''}</small></div>},{key:'created_at',label:'Uploaded',render:f=>date(f.created_at)},{key:'remove',label:'',render:f=><button className="table-button" onClick={()=>removeFile(f.id)}><X size={14}/> Remove</button>}]} empty="No files yet."/>:<div className="workspace-empty">No files yet — upload the files customers will download.</div>}<div className="button-row"><label className="admin-ghost" style={{cursor:'pointer'}}><Upload size={14}/> {uploading?'Uploading…':'Upload files'}<input type="file" multiple style={{display:'none'}} onChange={upload} disabled={uploading}/></label></div></div>}
 <div className="button-row price-actions"><button className="admin-primary" disabled={saving} onClick={save}><Save size={14}/> {saving?'Saving…':'Save digital settings'}</button><small className="workspace-hint">Publishing still goes through the Publish button — a digital product needs files and a priced license to be publishable.</small></div>
 </>}
 </div>
}

function Customers(){
 const [data,setData]=useState(null),[form,setForm]=useState({name:'',email:'',phone:''}),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminCustomers());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const add=async e=>{e.preventDefault();setBusy(true);try{await createAdminCustomer(form);setForm({name:'',email:'',phone:''});await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="CUSTOMERS" title="Customer relationships" description="Manage customer records from the browser." onRefresh={load} busy={busy}><form className="inline-form" onSubmit={add}><input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><button className="admin-primary">Add customer</button></form>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.customers||[]} columns={[{key:'name',label:'Customer',render:r=><div><strong>{r.name||'Unnamed'}</strong><small>{r.email||'No email'}</small></div>},{key:'phone',label:'Phone'},{key:'created_at',label:'Created',render:r=>date(r.created_at)}]}/></Shell>
}

const PROOF_STATUS_LABELS={draft:'Draft',sent:'Awaiting review',changes_requested:'Changes requested',approved:'Approved',superseded:'Superseded'}
const PROOF_GROUPS=[['sent','AWAITING REVIEW','Proofs the customer has been asked to review.'],['changes_requested','CHANGES REQUESTED','The customer asked for revisions — reply with a new version.'],['approved','APPROVED','Signed off and clear for production.'],['draft','DRAFTS','Prepared but not sent yet.']]
function excerpt(value,limit=90){const v=String(value||'').trim();return v.length>limit?v.slice(0,limit-1)+'…':v||'—'}

function QuoteProofs({quoteId,quote}){
 const [proofs,setProofs]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[file,setFile]=useState(null),[note,setNote]=useState(''),[sendNow,setSendNow]=useState(true),[sendingId,setSendingId]=useState(''),[sendOpen,setSendOpen]=useState(''),[sendNote,setSendNote]=useState({})
 const loadProofs=async()=>{setBusy(true);try{setProofs(await getAdminQuoteProofs(quoteId));setError('')}catch(e){setError(e.message||'Proofs unavailable.')}finally{setBusy(false)}}
 useEffect(()=>{setProofs([]);setFile(null);setNote('');setSendOpen('');if(quoteId)loadProofs()},[quoteId])
 const upload=async e=>{e.preventDefault();if(!file&&!note.trim()){setError('Choose a proof file or write a per-revision note first.');return}setBusy(true);setError('');try{if(file)await uploadAdminProof(quoteId,file,note);else await createAdminProof(quoteId,{customer_note:note,send:sendNow});setFile(null);setNote('');setSendNow(true);await loadProofs()}catch(e){setError(e.message||'The proof could not be saved.')}finally{setBusy(false)}}
 const sendProof=async proof=>{setSendingId(proof.id);setError('');try{let message=sendNote[proof.id]??proof.customer_note??'';try{const draft=await draft_proof_message(proof,quote);if(draft)message=draft}catch(_){/* AI seam unimplemented — the staff note stands. */}await sendAdminProof(proof.id,message);setSendOpen('');await loadProofs()}catch(e){setError(e.message||'The proof could not be sent.')}finally{setSendingId('')}}
 return <div className="subsection"><h3>Design proofs</h3>{error&&<div className="workspace-error">{error}</div>}
 {proofs.length?<div className="proof-admin-list">{proofs.map(p=><div className="proof-admin-row" key={p.id}><div><strong>v{p.design_version}{p.quote_number?' · '+p.quote_number:''}</strong><small>{p.design_name||'Design'}{p.sent_at?' · Sent '+date(p.sent_at):' · Not sent'}</small>{p.notes&&<small className="proof-staff-note">Staff note (internal): {p.notes}</small>}{p.customer_note&&<small>Customer note: {p.customer_note}</small>}{p.customer_comment&&<small className="proof-customer-comment">Change request: {p.customer_comment}</small>}</div><div className="button-row"><span className="pill">{PROOF_STATUS_LABELS[p.status]||p.status}</span>{p.status==='draft'&&sendOpen!==p.id&&<button className="table-button" onClick={()=>{setSendOpen(p.id);setSendNote(s=>(p.id in s?s:{...s,[p.id]:p.customer_note??''}))}}>Send</button>}</div>{p.status==='draft'&&sendOpen===p.id&&<form className="proof-send-form" onSubmit={e=>{e.preventDefault();sendProof(p)}}><label>Message the customer will see<textarea rows={3} value={sendNote[p.id]??p.customer_note??''} onChange={e=>setSendNote(s=>({...s,[p.id]:e.target.value}))} maxLength={4000}/></label><div className="ai-seam"><span className="ai-seam-badge">AI drafting coming</span><small>Customer messages will be AI-drafted and staff-approved here. Until then, edit the staff note directly.</small></div><div className="button-row"><button className="admin-primary" disabled={sendingId===p.id}>{sendingId===p.id?'Sending…':'Send proof'}</button><button type="button" className="table-button" onClick={()=>setSendOpen('')}>Cancel</button></div></form>}</div>)}</div>:<div className="workspace-empty">No proofs for this quote yet.</div>}
 <form className="proof-upload-form" onSubmit={upload}><p className="admin-kicker">NEW PROOF VERSION</p><label>Proof file<input type="file" accept=".stl,.3mf,.step,.stp,.obj,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/>{file&&<small>{file.name}</small>}</label><label>Per-revision staff note<textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="What changed in this version — the customer reads this with the proof." maxLength={4000}/></label><div className="ai-seam"><span className="ai-seam-badge">AI drafting coming</span><small>Customer messages will be AI-drafted and staff-approved here. Until then, the staff note above is what the customer sees.</small></div>{!file&&<label className="proof-send-toggle"><input type="checkbox" checked={sendNow} onChange={e=>setSendNow(e.target.checked)}/> Send to the customer now</label>}<div className="button-row"><button className="admin-primary" disabled={busy}>{busy?'Saving…':file?'Upload & send version':'Save proof'+(sendNow?' & send':' as draft')}</button></div><small className="proof-upload-hint">Uploading a file creates and sends the new version immediately. Without a file, the proof is saved{sendNow?' and sent':' as a draft you can send later'}.</small></form></div>
}

function Proofs({onOpenQuote}){
 const [groups,setGroups]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{const entries=await Promise.all(PROOF_GROUPS.map(([status])=>getAdminProofs({status}).catch(()=>[])));const next={};PROOF_GROUPS.forEach(([status],i)=>{next[status]=entries[i]});setGroups(next);setError('')}catch(e){setError(e.message||'Proofs unavailable.')}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 return <Shell kicker="PROOFS" title="Design proof queue" description="Every proof awaiting review, every change request, and every approval — each row opens its quote." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<div className="workspace-cards"><div className="mini-card"><strong>{(groups.sent||[]).length}</strong><span>Awaiting review</span></div><div className="mini-card"><strong>{(groups.changes_requested||[]).length}</strong><span>Changes requested</span></div><div className="mini-card"><strong>{(groups.approved||[]).length}</strong><span>Approved</span></div></div>
 {PROOF_GROUPS.map(([status,kicker,description])=>{const rows=groups[status]||[];if(!rows.length)return null;return <div className="subsection" key={status}><p className="admin-kicker">{kicker}</p><p className="proof-group-desc">{description}</p><Table rows={rows} columns={[{key:'proof',label:'Proof',render:r=><div><strong>v{r.design_version} · {r.quote_number||r.quote_id}</strong><small>{r.design_name||'Design'}</small></div>},{key:'status',label:'Status',render:r=><span className="pill">{PROOF_STATUS_LABELS[r.status]||r.status}</span>},{key:'note',label:'Latest note',render:r=>r.customer_comment?<span className="proof-customer-comment">{excerpt(r.customer_comment)}</span>:excerpt(r.customer_note||r.notes)},{key:'updated',label:'Updated',render:r=>date(r.updated_at||r.sent_at)},{key:'action',label:'Quote',render:r=><button className="table-button" onClick={()=>onOpenQuote&&onOpenQuote(r.quote_id)}>Open quote</button>}]}/></div>})}
 {PROOF_GROUPS.every(([status])=>!(groups[status]||[]).length)&&!busy&&<div className="workspace-empty">No proofs in the queue.</div>}</Shell>
}

function Quotes({quoteFocus}){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null)
 const [priceEdits,setPriceEdits]=useState({}),[savingPrices,setSavingPrices]=useState(false)
 const load=async()=>{setBusy(true);try{setData(await getAdminQuotes());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const send=async r=>{setBusy(true);try{await updateAdminQuote(r.id,{status:'sent'});await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const open=async id=>{setBusy(true);try{setSelected(await getAdminQuote(id));setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{if(quoteFocus?.id)open(quoteFocus.id)},[quoteFocus?.nonce])
 const quote=selected?.quote||{}
 // Pricing (Phase 5 "Quote needs pricing" flow): staff edit unit prices on
 // draft/under_review quotes; saving PUTs the items and records a new quote
 // version server-side. Sent+ quotes are read-only.
 const priceable=['draft','under_review'].includes(String(quote.status||'').toLowerCase())
 useEffect(()=>{setPriceEdits({})},[selected?.quote?.id])
 const priceInput=r=>priceEdits[r.id]??(Number(r.unit_price_cents||0)/100).toFixed(2)
 const dirtyPrices=(selected?.items||[]).some(r=>{const v=priceEdits[r.id];return v!=null&&Math.round(Number(v)*100)!==Number(r.unit_price_cents||0)})
 const savePrices=async()=>{
  const items=[]
  for(const r of selected?.items||[]){
   const raw=priceEdits[r.id]
   if(raw==null){items.push(r);continue}
   const cents=Math.round(Number(raw)*100)
   if(!Number.isFinite(cents)||cents<0){setError('Prices must be $0 or more.');return}
   items.push({...r,unit_price_cents:cents,pricing_mode:cents===Number(r.unit_price_cents||0)?r.pricing_mode:'manual'})
  }
  setSavingPrices(true);setError('')
  try{await updateAdminQuote(quote.id,{items});await open(quote.id);await load()}
  catch(e){setError(e.message||'Could not save prices.')}
  finally{setSavingPrices(false)}
 }
 const sendOpen=async()=>{await send({id:quote.id});await open(quote.id)}
 return <Shell kicker="SALES" title="Quotes" description="Review and advance quote workflow." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.quotes||[]} columns={[{key:'quote_number',label:'Quote',render:r=><strong>{r.quote_number||r.id}</strong>},{key:'customer',label:'Customer',render:r=>r.customer_name||r.customer_email||r.customer_id||'—'},{key:'status',label:'Status',render:r=><span className="pill">{r.status}</span>},{key:'total',label:'Total',render:r=>formatCents(r.total_cents)},{key:'action',label:'Action',render:r=><div className="button-row">{r.status==='draft'&&<button className="table-button" onClick={()=>send(r)}>Send</button>}<button className="table-button" onClick={()=>open(r.id)}>View</button></div>}]}/>
 {selected&&<div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">QUOTE DETAIL</p><h3>{quote.quote_number||quote.id}</h3><small>{quote.customer_name||quote.customer_email||'No customer'}</small></div><div className="button-row">{priceable&&<button className="admin-primary" disabled={busy||savingPrices} onClick={sendOpen}>Send quote</button>}<button className="table-button" onClick={()=>setSelected(null)}>Close</button></div></div>
  <FieldList fields={[['Status',quote.status||'—'],['Customer',quote.customer_name||quote.customer_email||'—'],['Total',formatCents(quote.total_cents)],['Created',date(quote.created_at)],['Expires',date(quote.expires_at)],['Notes',quote.notes||'—']]}/>
  <div className="subsection"><h3>Line items</h3><Table rows={selected.items||[]} columns={[{key:'description',label:'Item',render:r=><div><strong>{r.description||r.product_name||'Item'}</strong><small>{r.product_name||''}</small></div>},{key:'quantity',label:'Qty'},{key:'unit',label:'Unit price',render:r=>priceable?<input type="number" min="0" step="0.01" className="price-input" aria-label={'Unit price (USD) for '+(r.description||r.product_name||'item')} value={priceInput(r)} onChange={e=>setPriceEdits(p=>({...p,[r.id]:e.target.value}))}/>:formatCents(r.unit_price_cents)},{key:'line',label:'Line total',render:r=>formatCents((priceable?Math.round(Number(priceInput(r))*100):Number(r.unit_price_cents||0))*Number(r.quantity||0))}]}/>{priceable&&<div className="button-row price-actions"><button className="admin-primary" disabled={!dirtyPrices||savingPrices||busy} onClick={savePrices}>{savingPrices?'Saving…':'Save prices'}</button><small className="workspace-hint">Saving records a new version — the customer sees the updated total.</small></div>}</div>
  {(selected.versions||[]).length>0&&<div className="subsection"><h3>Version history</h3><Table rows={selected.versions} columns={[{key:'version',label:'Version',render:r=>'v'+(r.version||'—')},{key:'status',label:'Status',render:r=><span className="pill">{r.status||'—'}</span>},{key:'total',label:'Total',render:r=>formatCents(r.total_cents)},{key:'created_at',label:'Created',render:r=>date(r.created_at)}]}/></div>}
  <QuoteProofs quoteId={quote.id} quote={quote}/>
 </div>}
 </Shell>
}

function Users(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{const [u,p]=await Promise.all([getAdminUsers(),getAdminPermissions()]);setData({...u,permissions:p});setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 return <Shell kicker="SYSTEM" title="Team & permissions" description="Inspect the user and permission model enforced by FabOS." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<div className="workspace-cards"><div className="mini-card"><strong>{data?.users?.length||0}</strong><span>Users</span></div><div className="mini-card"><strong>{data?.permissions?.permissions?.length||0}</strong><span>Permissions</span></div></div><Table rows={data?.users||[]} columns={[{key:'username',label:'User',render:r=><div><strong>{r.username||r.email}</strong><small>{r.email||'—'}</small></div>},{key:'account_type',label:'Account'},{key:'role',label:'Role'},{key:'active',label:'Active',render:r=>r.active?'Yes':'No'},{key:'last_login_at',label:'Last login',render:r=>date(r.last_login_at)}]}/></Shell>
}

function SettingsPage(){
 const [data,setData]=useState(null),[selected,setSelected]=useState(''),[value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[validity,setValidity]=useState(''),[validityMsg,setValidityMsg]=useState(''),[baseUrl,setBaseUrl]=useState(''),[baseUrlMsg,setBaseUrlMsg]=useState('')
 const load=async()=>{setBusy(true);try{const d=await getAdminSettings();setData(d);const k=Object.keys(d.settings||{})[0]||'';const sk=secretKeySet(d);setSelected(k);setValue(sk.has(k)?'':String(d.settings?.[k]??''));setValidity(String(d.settings?.quote_validity_days??''));setValidityMsg('');setError('');setBaseUrl(String(d.settings?.public_base_url??''));setBaseUrlMsg('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 useEffect(()=>{if(selected&&data&&!secretKeySet(data).has(selected))setValue(String(data.settings?.[selected]??''))},[selected])
 const save=async()=>{setBusy(true);try{await updateAdminSetting(selected,value);await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const saveValidity=async()=>{const n=Number(String(validity).trim());if(!Number.isFinite(n)||Math.round(n)<1||Math.round(n)>365){setValidityMsg('Enter a whole number of days between 1 and 365.');return}setBusy(true);setValidityMsg('');try{await updateAdminSetting('quote_validity_days',String(Math.round(n)));setValidityMsg('Saved.');await load()}catch(e){setValidityMsg(e.message||'Could not save.')}finally{setBusy(false)}}
 const saveBaseUrl=async()=>{
  const next=String(baseUrl||'').trim()
  setBusy(true);setBaseUrlMsg('')
  try{await updateAdminSetting('public_base_url',next);setBaseUrlMsg('Saved.');await load()}
  catch(e){setBaseUrlMsg(e.message||'Could not save.')}
  finally{setBusy(false)}
 }
 const keys=Object.keys(data?.settings||{}),hasValidity=Object.prototype.hasOwnProperty.call(data?.settings||{},'quote_validity_days'),hasBaseUrl=Object.prototype.hasOwnProperty.call(data?.settings||{},'public_base_url')
 // Secret keys are read-only in the advanced free-text editor: the API only
 // serves {"configured": bool} masks for them, so the textarea would show
 // "[object Object]" and saving would clobber the real secret. Staff edits
 // secrets in the Integrations section above, which leaves empty submissions
 // untouched.
 const secretKeys=secretKeySet(data),selectedIsSecret=secretKeys.has(selected),selectedSecretConfigured=selectedIsSecret&&secretConfigured(data?.settings?.[selected])
 return <Shell kicker="SYSTEM" title="Settings center" description="Browser access to validated shop settings." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}
 <div className="subsection key-settings"><p className="admin-kicker">KEY SETTINGS</p>{hasValidity?<div className="key-setting"><div><strong>Quote validity period</strong><small>Days a newly sent quote stays valid before it expires (Phase 0 decision D5 — default 14). Applies when a quote is sent; quotes already sent keep their own expiry date.</small></div><div className="key-setting-input"><input type="number" min={1} max={365} value={validity} onChange={e=>{setValidity(e.target.value);setValidityMsg('')}} aria-label="Quote validity period in days"/><span>days</span><button className="admin-primary" onClick={saveValidity} disabled={busy}>Save</button></div>{validityMsg&&<small className={'key-setting-msg'+(validityMsg==='Saved.'?' ok':'')}>{validityMsg}</small>}</div>:<div className="workspace-empty">The quote_validity_days setting is not exposed by this API version yet.</div>}{hasBaseUrl?<div className="key-setting"><div><strong>Public base URL</strong><small>{settingMetaDescription(data,'public_base_url')||'Public address of the shop, e.g. https://fabvex.com. Used to build absolute links in customer notification emails. Leave empty to keep the current relative links.'}</small></div><div className="key-setting-input"><input value={baseUrl} onChange={e=>{setBaseUrl(e.target.value);setBaseUrlMsg('')}} placeholder="https://fabvex.com" aria-label="Public base URL"/><button className="admin-primary" onClick={saveBaseUrl} disabled={busy}>Save</button></div>{baseUrlMsg&&<small className={'key-setting-msg'+(baseUrlMsg==='Saved.'?' ok':'')}>{baseUrlMsg}</small>}</div>:<div className="workspace-empty">The public_base_url setting is not exposed by this API version yet.</div>}</div>
 <IntegrationsSection data={data} busy={busy} setBusy={setBusy} onSaved={load} onError={setError}/>
 <div className="subsection"><p className="admin-kicker">ADVANCED — ALL SETTINGS</p>{keys.length?<div className="settings-editor"><label>Setting<select value={selected} onChange={e=>setSelected(e.target.value)}>{keys.map(k=><option key={k}>{k}</option>)}</select></label><label>Value{selectedIsSecret?<textarea value={selectedSecretConfigured?'Configured (hidden) — edit secrets in the Integrations section above.':'Not set — edit secrets in the Integrations section above.'} rows={5} disabled aria-label="Secret value (hidden)"/>:<textarea value={value} onChange={e=>setValue(e.target.value)} rows={5}/>}</label><button className="admin-primary" onClick={save} disabled={busy||selectedIsSecret}><Save size={15}/> Save setting</button></div>:<div className="workspace-empty">No settings exposed.</div>}{selectedIsSecret&&keys.length>0&&<small className="workspace-hint">Secret keys are read-only here — the API never returns their values. Use the Integrations section above to change them; leaving the field empty keeps the current value.</small>}</div></Shell>
}

// ---------------------------------------------------------------------------
// Phase 3 — Integrations section (Part A). Rendered from the settings metadata
// the backend serves, so new integration keys appear here without frontend
// changes. Secret values use masked inputs: the API returns a "configured" /
// empty indicator, never plaintext — the value is never displayed, and an
// empty submit keeps the existing value (nothing is sent). This section lives
// inside SettingsPage, which is only reachable from the team-gated admin
// console, so it inherits exactly the same admin gate as every other setting.
// ---------------------------------------------------------------------------
const SECRET_KEY_HINT=/(secret|api_key|apikey|token|credential|password|private_key)/i
const INTEGRATION_KEY_HINT=/(resend|smtp|stripe|square|twilio|webhook|oauth|provider)/i
function humanizeSettingKey(key){
 return String(key||'')
  .replace(/^(marketing|integration)_/,'')
  .replace(/_/g,' ')
  .replace(/\b\w/g,c=>c.toUpperCase())
  .replace(/\bApi\b/g,'API').replace(/\bAi\b/g,'AI').replace(/\bSmtp\b/g,'SMTP').replace(/\bUrl\b/g,'URL')
}
function secretConfigured(value){
 // The backend masks secrets as {"configured": bool} (never plaintext).
 if(value&&typeof value==='object')return value.configured===true
 const v=String(value??'').trim().toLowerCase()
 if(!v||v==='false'||v==='0'||v==='not set'||v==='unset')return false
 return true
}
// Secret-bearing keys for the ADVANCED editor. The API serves secret values
// as {"configured": bool} masks (never plaintext), so loading the mask into
// the free-text textarea would show "[object Object]" — and saving it would
// overwrite the real secret with that literal string, silently breaking the
// integration (Resend/Stripe/Square keys) until someone re-pastes the real
// value. Prefer the backend's explicit secret_keys list; fall back to the
// mask shape so the guard holds even when the list is absent.
function secretKeySet(data){
 const fromApi=Array.isArray(data?.secret_keys)?data.secret_keys:null
 if(fromApi)return new Set(fromApi)
 const settings=data?.settings||{}
 return new Set(Object.keys(settings).filter(k=>{const v=settings[k];return v&&typeof v==='object'&&Object.prototype.hasOwnProperty.call(v,'configured')}))
}
function integrationEntries(data){
 const meta=data?.metadata||{},settings=data?.settings||{}
 const groups=Object.entries(meta)
 const describe=key=>{
  const raw=groups.reduce((found,[,g])=>found??(g&&typeof g==='object'?g[key]:undefined),undefined)
  if(raw&&typeof raw==='object')return {key,description:String(raw.description||raw.label||''),secret:raw.secret===true||String(raw.secret||'').toLowerCase()==='true'||SECRET_KEY_HINT.test(key)}
  return {key,description:String(raw||''),secret:SECRET_KEY_HINT.test(key)}
 }
 // Preferred: a dedicated integrations metadata group served by the backend.
 const group=groups.find(([name])=>/integrat/i.test(String(name)))
 if(group){
  return Object.entries(group[1]||{}).map(([key])=>describe(key))
 }
 // Fallback: collect integration/secret-ish keys from any metadata group so
 // the section still renders on an API that hasn't added the group yet.
 const seen=new Set(),entries=[]
 for(const [,g] of groups)for(const key of Object.keys(g||{})){
  if(seen.has(key))continue
  if(INTEGRATION_KEY_HINT.test(key)||SECRET_KEY_HINT.test(key)){seen.add(key);entries.push(describe(key))}
 }
 // Include secret-ish integration values the backend masks even when metadata
 // lacks them (e.g. a brand-new secret key with no description yet).
 for(const key of Object.keys(settings)){
  if(!seen.has(key)&&SECRET_KEY_HINT.test(key)&&/(resend|stripe|twilio|smtp|webhook)/i.test(key)){seen.add(key);entries.push({key,description:'',secret:true})}
 }
 return entries
}
function IntegrationRow({entry,value,onSaved,onError,busy,setBusy}){
 const secret=entry.secret
 const [input,setInput]=useState(secret?'':String(value??''))
 const [msg,setMsg]=useState('')
 useEffect(()=>{setInput(secret?'':String(value??''))},[secret,value])
 const configured=secretConfigured(value)
 const save=async()=>{
  if(secret&&!String(input).trim()){setMsg('Left empty — the existing value is kept.');return}
  setBusy(true);setMsg('')
  try{
   await updateAdminSetting(entry.key,String(input))
   if(secret)setInput('')
   setMsg('Saved.')
   await onSaved()
  }catch(e){const m=e?.message||'Could not save.';setMsg(m);onError(m)}
  finally{setBusy(false)}
 }
 return <div className="key-setting"><div><strong>{humanizeSettingKey(entry.key)}</strong>{entry.description&&<small>{entry.description}</small>}{secret&&<small>{configured?<span className="pill">Configured</span>:<span className="pill">Not set</span>}{configured?' A new value replaces it. Leave empty to keep the current value.':' Enter the key to enable this integration.'}</small>}</div><div className="key-setting-input">{secret?<input type="password" autoComplete="new-password" value={input} onChange={e=>{setInput(e.target.value);setMsg('')}} placeholder={configured?'•••••••• (new value)':'Paste the secret key'} aria-label={humanizeSettingKey(entry.key)}/>:<input value={input} onChange={e=>{setInput(e.target.value);setMsg('')}} aria-label={humanizeSettingKey(entry.key)}/>}<button className="admin-primary" onClick={save} disabled={busy}>Save</button></div>{msg&&<small className={'key-setting-msg'+(msg==='Saved.'?' ok':'')}>{msg}</small>}</div>
}
function IntegrationsSection({data,busy,setBusy,onSaved,onError}){
 if(!data)return null
 const entries=integrationEntries(data)
 return <div className="subsection key-settings"><p className="admin-kicker">INTEGRATIONS</p>{entries.length?entries.map(entry=><IntegrationRow key={entry.key} entry={entry} value={data?.settings?.[entry.key]} onSaved={onSaved} onError={onError} busy={busy} setBusy={setBusy}/>):<div className="workspace-empty">No integration settings are exposed by this API version yet. They will appear here automatically once the backend serves them.</div>}</div>
}

function AI(){
 const [status,setStatus]=useState(null),[message,setMessage]=useState(''),[messages,setMessages]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{getAdminAiStatus().then(setStatus).catch(e=>setError(e.message))},[])
 const send=async e=>{e.preventDefault();const text=message.trim();if(!text)return;setMessages(m=>[...m,{role:'user',content:text}]);setMessage('');setBusy(true);try{const d=await sendAdminAiMessage(text);setMessages(m=>[...m,{role:'assistant',content:d.response||'No response returned.'}])}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="AI" title="FabOS assistant" description="Use the existing bounded, advisory AI service from the browser."><div className="ai-status"><span className={status?.enabled?'status-good':'status-warn'}>{status?.enabled?'AI enabled':'AI not enabled'}</span><span>{status?.provider||'No provider configured'}</span></div>{error&&<div className="workspace-error">{error}</div>}<div className="chat-history">{messages.length?messages.map((m,i)=><div className={'chat-message '+m.role} key={i}><strong>{m.role==='user'?'You':'FabOS'}</strong><p>{m.content}</p></div>):<div className="workspace-empty">Ask about operations, orders, production, inventory, or product marketing.</div>}</div><form className="chat-form" onSubmit={send}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="What needs attention today?"/><button className="admin-primary" disabled={busy}><Brain size={15}/> Ask</button></form></Shell>
}

function Marketing(){
 const [data,setData]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{const [d,p,po]=await Promise.all([getAdminMarketingDashboard(),getAdminMarketingProviders(),getAdminMarketingPosts()]);setData({dashboard:d,providers:p.providers||[],posts:po.posts||[]});setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const approve=async id=>{setBusy(true);try{await approveAdminMarketingPost(id);await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const queue=async()=>{setBusy(true);try{await queueAdminMarketingPosts();await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="MARKETING" title="Marketing & sales hub" description="Expose the provider-neutral marketing system already built into FabOS." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<div className="workspace-cards"><div className="mini-card"><strong>{data.posts?.length||0}</strong><span>Posts</span></div><div className="mini-card"><strong>{data.providers?.filter(p=>p.connected||p.enabled).length||0}</strong><span>Connected providers</span></div></div><div className="tag-list">{(data.providers||[]).map((p,i)=><span className="pill" key={p.id||i}>{p.name||p.provider||p.channel||'Provider'} · {p.connected||p.enabled?'connected':'not connected'}</span>)}</div><Table rows={data.posts||[]} columns={[{key:'title',label:'Post',render:r=><div><strong>{r.title||'Untitled'}</strong><small>{r.status||'draft'}</small></div>},{key:'scheduled_at',label:'Scheduled',render:r=>date(r.scheduled_at)},{key:'status',label:'Status'},{key:'action',label:'Action',render:r=>String(r.status).toLowerCase()==='draft'?<button className="table-button" onClick={()=>approve(r.id)}>Approve</button>:null}]}/><div className="workspace-actions"><button className="admin-ghost" onClick={queue} disabled={busy}><Activity size={15}/> Queue due posts</button></div></Shell>
}

function Invoices({invoiceFocus}){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null)
 const load=async()=>{setBusy(true);try{setData(await getAdminInvoices());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const open=async id=>{setBusy(true);try{setSelected(await getAdminInvoice(id))}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{if(invoiceFocus?.id)open(invoiceFocus.id)},[invoiceFocus?.nonce])
 return <Shell kicker="BILLING" title="Invoices & payments" description="Review invoices and payment history without leaving the operations console." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.invoices||[]} columns={[{key:'invoice_number',label:'Invoice',render:r=><strong>{r.invoice_number||r.number||r.id}</strong>},{key:'customer_name',label:'Customer',render:r=>r.customer_name||r.customer_email||r.customer_id||'—'},{key:'status',label:'Status',render:r=><span className="pill">{r.status||'—'}</span>},{key:'total_cents',label:'Total',render:r=>formatCents(r.total_cents||r.amount_cents)},{key:'due_at',label:'Due',render:r=>date(r.due_at)},{key:'action',label:'Details',render:r=><button className="table-button" onClick={()=>open(r.id)}>View</button>}]}/>{selected&&<div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">INVOICE DETAIL</p><h3>{selected.invoice?.invoice_number||selected.invoice?.number||selected.invoice?.id}</h3></div><button className="table-button" onClick={()=>setSelected(null)}>Close</button></div><FieldList fields={[['Status',selected.invoice?.status||'—'],['Customer',selected.invoice?.customer_name||selected.invoice?.customer_email||'—'],['Order',selected.invoice?.order_number||'—'],['Total',formatCents(selected.invoice?.total_cents)],['Paid',formatCents(selected.invoice?.paid_cents)],['Balance',formatCents(selected.invoice?.balance_cents)],['Issued',date(selected.invoice?.created_at)],['Due',date(selected.invoice?.due_at)]]}/>{selected.items?.length>0&&<><p className="admin-kicker">LINE ITEMS</p><Table rows={selected.items} columns={[{key:'description',label:'Item',render:r=><strong>{r.description||'Item'}</strong>},{key:'quantity',label:'Qty'},{key:'unit',label:'Unit price',render:r=>formatCents(r.unit_price_cents)},{key:'line',label:'Line total',render:r=>formatCents(Number(r.unit_price_cents||0)*Number(r.quantity||0))}]}/></>}{selected.payments?.length>0&&<><p className="admin-kicker">PAYMENTS</p><Table rows={selected.payments} columns={[{key:'paid_at',label:'Date',render:r=>date(r.paid_at)},{key:'method',label:'Method'},{key:'reference',label:'Reference',render:r=>r.reference||'—'},{key:'amount',label:'Amount',render:r=>formatCents(r.amount_cents)}]}/></>}<div className="subsection"><h3>Record a payment</h3><RecordPaymentForm invoiceId={selected.invoice?.id} onDone={()=>open(selected.invoice.id)}/></div></div>}</Shell>
}

// ---------------------------------------------------------------------------
// Phase 4 — fulfillment detail: inspect the shipment, edit method / carrier /
// tracking number / destination inline (PATCH), and advance the state. Only
// the transitions the backend accepts from the current status get buttons;
// backend transition errors are surfaced readably and the record reloads
// after every successful change.
// ---------------------------------------------------------------------------
function FulfillmentDetail({id,onClose,onChanged}){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[form,setForm]=useState({method:'',carrier:'',tracking_number:'',destination:''})
 const load=async()=>{setBusy(true);try{const d=await getAdminFulfillment(id);const f=d?.fulfillment||d||{};setData(d);setForm({method:f.method||'',carrier:f.carrier||'',tracking_number:f.tracking_number||f.tracking||'',destination:f.destination||''});setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[id])
 const save=async e=>{e.preventDefault();setBusy(true);setNotice('');setError('');try{await updateAdminFulfillment(id,{method:form.method.trim(),carrier:form.carrier.trim(),tracking_number:form.tracking_number.trim(),destination:form.destination.trim()});setNotice('Shipment details saved.');await load();if(onChanged)onChanged()}catch(e){setError('Could not save the shipment: '+(e?.message||'unknown error'))}finally{setBusy(false)}}
 const advance=async to=>{setBusy(true);setNotice('');setError('');try{await transitionAdminFulfillment(id,to);setNotice('Status updated to '+fulfillmentStatusLabel(to)+'.');await load();if(onChanged)onChanged()}catch(e){setError('Could not change the status: '+(e?.message||'unknown error'))}finally{setBusy(false)}}
 const f=data?.fulfillment||data||{}
 const transitions=fulfillmentTransitions(f.status,f.method)
 return <div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">FULFILLMENT DETAIL</p><h3>{f.order_number||f.order_id||id}</h3><small>{fulfillmentStatusLabel(f.status)}</small></div><button className="table-button" onClick={onClose}>Close</button></div>
 {error&&<div className="workspace-error">{error}</div>}
 {notice&&<div className="workspace-note">{notice}</div>}
 {!data&&busy&&<div className="workspace-empty">Loading…</div>}
 {data&&<><FieldList fields={[['Status',fulfillmentStatusLabel(f.status)],['Method',f.method||'—'],['Carrier',f.carrier||'—'],['Tracking',f.tracking_number||f.tracking||'—'],['Destination',f.destination||'—'],['Packed',date(f.packed_at)],['Shipped',date(f.shipped_at)],['Delivered',date(f.delivered_at)],['Picked up',date(f.picked_up_at)]]}/>
 <div className="subsection"><h3>Edit shipment</h3><form className="inline-form" onSubmit={save}><input placeholder="Method (ship, pickup…)" value={form.method} onChange={e=>setForm({...form,method:e.target.value})} aria-label="Shipping method"/><input placeholder="Carrier" value={form.carrier} onChange={e=>setForm({...form,carrier:e.target.value})} aria-label="Carrier"/><input placeholder="Tracking number" value={form.tracking_number} onChange={e=>setForm({...form,tracking_number:e.target.value})} aria-label="Tracking number"/><input placeholder="Destination" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} aria-label="Destination"/><button className="admin-primary" disabled={busy}>{busy?'Saving…':'Save'}</button></form></div>
 {transitions.length>0?<div className="subsection"><h3>Advance status</h3><div className="button-row">{transitions.map(t=><button key={t.to_state} className="admin-primary" disabled={busy} onClick={()=>advance(t.to_state)}>{t.label}</button>)}</div><small className="workspace-hint">Only the transitions accepted from “{fulfillmentStatusLabel(f.status)}” are shown — the backend validates every change server-side too.</small></div>:<div className="workspace-empty">This shipment is {fulfillmentStatusLabel(f.status).toLowerCase()} — no further transitions.</div>}
 </>}</div>
}

function Fulfillment(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null)
 const load=async()=>{setBusy(true);try{setData(await getAdminFulfillments());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const open=id=>setSelected({id,nonce:Date.now()})
 return <Shell kicker="FULFILLMENT" title="Shipping & fulfillment" description="Track fulfillment records, fix shipment details, and advance statuses from the browser." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.fulfillments||[]} columns={[{key:'order_number',label:'Order',render:r=><strong>{r.order_number||r.order_id||'—'}</strong>},{key:'status',label:'Status',render:r=><span className="pill">{fulfillmentStatusLabel(r.status)}</span>},{key:'carrier',label:'Carrier',render:r=>r.carrier||'—'},{key:'tracking_number',label:'Tracking',render:r=>r.tracking_number||r.tracking||'—'},{key:'shipped_at',label:'Shipped',render:r=>date(r.shipped_at)},{key:'action',label:'Details',render:r=><button className="table-button" onClick={()=>open(r.id)}>View</button>}]}/>{selected&&<FulfillmentDetail key={selected.nonce} id={selected.id} onClose={()=>setSelected(null)} onChanged={load}/>}</Shell>
}

function Health(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getSystemHealth());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 return <Shell kicker="SYSTEM" title="Health & diagnostics" description="Verify the live API boundary and surface its reported service state." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<div className="workspace-cards"><div className="mini-card"><strong>{data?.status||'—'}</strong><span>API status</span></div><div className="mini-card"><strong>{data?.version||'—'}</strong><span>API version</span></div><div className="mini-card"><strong>{data?.service||'FabOS'}</strong><span>Service</span></div></div>{data?<FieldList fields={Object.entries(data).filter(([,v])=>v==null||['string','number','boolean'].includes(typeof v)).map(([k,v])=>[k,String(v)])}/>:<div className="workspace-empty">No health response yet.</div>}</Shell>
}

function Inventory({dashboard}){return <Shell kicker="MATERIALS" title="Inventory & filament" description="Monitor material availability using the same inventory data that drives production readiness."><div className="workspace-cards"><div className="mini-card"><strong>{dashboard?.inventory?.low_filament||0}</strong><span>Low filament spools</span></div><div className="mini-card"><strong>{dashboard?.inventory?.low_supplies||0}</strong><span>Low supplies</span></div><div className="mini-card"><strong>{dashboard?.inventory?.filament_threshold_g||0}g</strong><span>Low-stock threshold</span></div></div><Table rows={dashboard?.inventory?.spools||[]} columns={[{key:'name',label:'Spool',render:r=><div><strong>{r.name||r.material||r.id||'Spool'}</strong><small>{r.brand||r.material||'Material'}</small></div>},{key:'remaining_g',label:'Remaining',render:r=>r.remaining_g!=null?Math.round(Number(r.remaining_g))+' g':'—'},{key:'color',label:'Color',render:r=>r.color||'—'},{key:'printer_name',label:'Assigned printer',render:r=>r.printer_name||'—'}]}/></Shell>}

function QC({dashboard}){return <Shell kicker="QUALITY" title="Quality control" description="See quality inspections waiting for review before work moves downstream."><div className="workspace-cards"><div className="mini-card"><strong>{dashboard?.business?.pending_qc||0}</strong><span>Pending inspections</span></div><div className="mini-card"><strong>{dashboard?.production?.completed_jobs||0}</strong><span>Completed jobs</span></div><div className="mini-card"><strong>{dashboard?.production?.failed_jobs||0}</strong><span>Failed jobs</span></div></div><div className="workspace-empty">QC records are currently summarized by the operations API. The next QC pass can expose individual inspections, photos, disposition, and rework actions without duplicating the manufacturing rules in the web client.</div></Shell>}


function DesignVault(){
 const [data,setData]=useState(null),[q,setQ]=useState(''),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminDesigns(q));setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 const open=async id=>{setBusy(true);try{setSelected(await getAdminDesign(id));setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="DESIGN VAULT" title="Digital designs" description="Browse customer and catalog designs, revisions, printable assets, and production history from the authoritative vault." onRefresh={load} busy={busy}>
  <div className="workspace-toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search designs or SKU…"/><button className="admin-primary" onClick={load}>Search</button></div>
  {error&&<div className="workspace-error">{error}</div>}
  <Table rows={data?.designs||[]} columns={[
   {key:'name',label:'Design',render:r=><div><strong>{r.name||r.id}</strong><small>{r.sku||'No SKU'} · {r.category||'Other'}</small></div>},
   {key:'current_version',label:'Version',render:r=>'v'+(r.current_version||1)},
   {key:'asset_count',label:'Assets'},
   {key:'updated_at',label:'Updated',render:r=>date(r.updated_at)},
   {key:'action',label:'Details',render:r=><button className="table-button" onClick={()=>open(r.id)}>View</button>}
  ]}/>
  {selected&&<div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">DESIGN DETAIL</p><h3>{selected.design?.name||selected.design?.id}</h3><small>{selected.design?.id}</small></div><button className="table-button" onClick={()=>setSelected(null)}>Close</button></div>
   <div className="workspace-cards"><div className="mini-card"><strong>v{selected.design?.current_version||1}</strong><span>Current version</span></div><div className="mini-card"><strong>{selected.assets?.length||0}</strong><span>Assets</span></div><div className="mini-card"><strong>{selected.model?.piece_count||0}</strong><span>Complete-set pieces</span></div></div>
   <div className="subsection"><h3>Assets</h3><Table rows={selected.assets||[]} columns={[{key:'original_name',label:'File'},{key:'kind',label:'Type'},{key:'version',label:'Version',render:r=>'v'+(r.version||'—')},{key:'bytes',label:'Size',render:r=>r.bytes?Math.round(Number(r.bytes)/1024)+' KB':'—'},{key:'is_primary',label:'Primary',render:r=>r.is_primary?'Yes':'—'}]}/></div>
   <div className="subsection"><h3>Production history</h3><Table rows={selected.production_history||[]} columns={[{key:'status',label:'Status'},{key:'order_number',label:'Order'},{key:'printer_name',label:'Printer'},{key:'created_at',label:'Created',render:r=>date(r.created_at)}]}/></div>
  </div>}
 </Shell>
}

function QCWorkspace({qcFocus}){
 const [data,setData]=useState(null),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminQc());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 const open=async id=>{setBusy(true);try{const d=await getAdminQcDetail(id);const inspection=d.inspection||{};let items=[];try{items=JSON.parse(inspection.checklist_json||'[]')}catch{};setSelected({...inspection,checklist:inspection.checklist||items,notes:inspection.notes||''});setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 // Phase 5 — deep-linking an action item opens the inspection directly.
 useEffect(()=>{if(qcFocus?.id)open(qcFocus.id)},[qcFocus?.nonce])
 const save=async status=>{if(!selected)return;setBusy(true);try{await updateAdminQc(selected.id,{items:selected.checklist||[],notes:selected.notes||'',status});await open(selected.id);await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const reconcile=async()=>{setBusy(true);try{await reconcileAdminQc();await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="QUALITY" title="QC inspections" description="Review completed production inspections and record pass, rework, or pending disposition without duplicating manufacturing rules in the browser." onRefresh={load} busy={busy}>
  <div className="button-row"><button className="admin-primary" onClick={reconcile} disabled={busy}>Reconcile inspections</button></div>
  {error&&<div className="workspace-error">{error}</div>}
  <Table rows={data?.inspections||[]} columns={[
   {key:'product_name',label:'Job',render:r=><div><strong>{r.product_name||'Custom job'}</strong><small>{r.order_number||'—'} · {r.customer_name||'No customer'}</small></div>},
   {key:'status',label:'Status',render:r=><span className="pill">{r.status||'pending'}</span>},
   {key:'created_at',label:'Created',render:r=>date(r.created_at)},
   {key:'inspected_at',label:'Inspected',render:r=>date(r.inspected_at)},
   {key:'action',label:'Review',render:r=><button className="table-button" onClick={()=>open(r.id)}>Open</button>}
  ]}/>
  {selected&&<div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">QC REVIEW</p><h3>{selected.product_name||selected.id}</h3><small>{selected.order_number||'No order'} · {selected.customer_name||'No customer'}</small></div><button className="table-button" onClick={()=>setSelected(null)}>Close</button></div>
   <div className="subsection"><h3>Checklist</h3><div className="qc-checklist">{(selected.checklist||[]).map((item,i)=><label key={i}><input type="checkbox" checked={!!item.checked} onChange={e=>setSelected(s=>({...s,checklist:s.checklist.map((x,j)=>j===i?{...x,checked:e.target.checked}:x)}))}/><span>{item.text||'Checklist item'}</span></label>)}</div></div>
   <label className="settings-editor"><span>Notes</span><textarea rows={5} value={selected.notes||''} onChange={e=>setSelected(s=>({...s,notes:e.target.value}))}/></label>
   <div className="button-row"><button className="table-button" onClick={()=>save('pending')} disabled={busy}>Save pending</button><button className="table-button" onClick={()=>save('rework')} disabled={busy}>Send to rework</button><button className="admin-primary" onClick={()=>save('passed')} disabled={busy}>Pass QC</button></div>
  </div>}
 </Shell>
}

// ---------------------------------------------------------------------------
// Phase 3 — admin order detail: the money-handoff flow (order → invoice →
// payment → production) entirely in the web console. The next step shown here
// comes from the backend's machine-readable next-step state; "Start jobs" is
// disabled with an explanatory label while the order awaits payment, and the
// backend's server-side state validation remains the safety net on every call.
// ---------------------------------------------------------------------------
function RecordPaymentForm({invoiceId,onDone}){
 const [amount,setAmount]=useState(''),[method,setMethod]=useState(''),[reference,setReference]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 const submit=async e=>{
  e.preventDefault()
  const cents=Math.round(Number(amount)*100)
  if(!Number.isFinite(cents)||cents<=0){setMsg('Enter a payment amount greater than $0.');return}
  setBusy(true);setMsg('')
  try{await recordAdminInvoicePayment(invoiceId,{amount_cents:cents,method:method.trim(),reference:reference.trim()});setAmount('');setMethod('');setReference('');setMsg('Saved.');await onDone()}
  catch(err){setMsg(err?.message||'Could not record the payment.')}
  finally{setBusy(false)}
 }
 return <form className="settings-editor" onSubmit={submit}><p className="admin-kicker">RECORD PAYMENT</p><label>Amount (USD)<input type="number" min="0.01" step="0.01" value={amount} onChange={e=>{setAmount(e.target.value);setMsg('')}} required/></label><label>Method<input value={method} onChange={e=>setMethod(e.target.value)} placeholder="Card, cash, check…"/></label><label>Reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Transaction ID / memo"/></label><div><button className="admin-primary" disabled={busy}>{busy?'Saving…':'Record payment'}</button></div>{msg&&<small className={'key-setting-msg'+(msg==='Saved.'?' ok':'')}>{msg}</small>}</form>
}

function AdminOrderDetail({orderId,onClose,onStart,working}){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const load=async()=>{
  setBusy(true)
  try{
   const detail=await getAdminOrder(orderId)
   let invoice=detail?.invoice||null
   const invoiceId=invoice?.id||detail?.invoice_id||''
   if(!invoice&&invoiceId){try{invoice=(await getAdminInvoice(invoiceId))?.invoice||{id:invoiceId}}catch{invoice={id:invoiceId}}}
   setData({...detail,invoice,invoice_id:invoiceId});setError('')
  }catch(e){setError(e?.message||'Could not load the order.')}
  finally{setBusy(false)}
 }
 useEffect(()=>{load()},[orderId])
 const createInvoice=async()=>{
  setBusy(true);setNotice('')
  try{const invoice=await createAdminInvoiceFromOrder(orderId);setNotice(invoice?.invoice_number||invoice?.number?`Invoice ${invoice.invoice_number||invoice.number} created.`:'Invoice created.');await load()}
  catch(e){setNotice(e?.message||'Could not create the invoice.')}
  finally{setBusy(false)}
 }
 const order=data?.order||{},invoice=data?.invoice||null,invoiceId=data?.invoice_id||invoice?.id||''
 const gate=orderPaymentGate({status:order.status,next_step:extractNextStep(data)})
 const step=extractNextStep(data)
 const nextLabel=step?nextStepLabel(step):gate==='awaiting_payment'?'Awaiting payment':gate==='ready'?'Ready for production':gate==='terminal'?nextStepLabel(order.status):''
 return <div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">ORDER DETAIL</p><h3>{order.order_number||orderId}</h3><small>{order.customer_name||order.customer_email||''}</small></div><button className="table-button" onClick={onClose}>Close</button></div>
  {error&&<div className="workspace-error">{error}</div>}
  {!data&&busy&&<div className="workspace-empty">Loading…</div>}
  {data&&<><FieldList fields={[['Status',order.status||'—'],['Next step',nextLabel||'—'],['Customer',order.customer_name||order.customer_email||'—'],['Total',formatCents(order.total_cents)],['Placed',date(order.created_at)]]}/>
  <div className="subsection"><h3>Money handoff</h3>{invoice||invoiceId?<><FieldList fields={[['Invoice',invoice?.invoice_number||invoice?.number||invoiceId],['Status',invoice?.status||'—'],['Total',formatCents(invoice?.total_cents)],['Paid',formatCents(invoice?.paid_cents)],['Balance',formatCents(invoice?.balance_cents)]]}/>{invoiceId&&<RecordPaymentForm invoiceId={invoiceId} onDone={load}/>}</>:<><div className="workspace-empty">No invoice yet for this order.</div><div className="workspace-actions"><button className="admin-primary" disabled={busy} onClick={createInvoice}>{busy?'Working…':'Create invoice'}</button></div></>}{notice&&<p className="workspace-note">{notice}</p>}</div>
  <div className="subsection"><h3>Production</h3>{gate==='terminal'?<div className="workspace-empty">This order is {nextStepLabel(order.status).toLowerCase()} — no production action available.</div>:gate==='awaiting_payment'?<div className="workspace-actions"><button className="admin-primary" disabled title="This order is awaiting payment.">Needs payment first</button></div>:<div className="workspace-actions"><button className="admin-primary" disabled={working||busy} onClick={()=>onStart(order.id||orderId)}>Start jobs</button></div>}<small className="workspace-hint">Production start is validated server-side as well — a failed state check returns a clear error.</small></div></>}
 </div>
}

function Operations({dashboard,onRefresh,busy,orderFocus}){
 const [error,setError]=useState(''),[working,setWorking]=useState(null),[targets,setTargets]=useState({}),[probe,setProbe]=useState({}),[orderId,setOrderId]=useState(null)
 useEffect(()=>{if(orderFocus?.id)setOrderId(orderFocus.id)},[orderFocus?.nonce])
 const run=async(key,fn)=>{setWorking(key);try{const d=await fn();if(d?.result)setProbe(p=>({...p,[key]:d.result}));await onRefresh();setError('')}catch(e){setError(e.message)}finally{setWorking(null)}}
 const start=async id=>run('order-'+id,()=>startAdminProduction(id))
 const preflight=id=>run('probe-'+id,()=>adminPrinterPreflight(id))
 const preheat=(id)=>run('heat-'+id,()=>adminPrinterPreheat(id,targets[id]?.hotend||null,targets[id]?.bed||null))
 const action=(id,a)=>{if(a==='cancel'&&!window.confirm('Cancel the active print on this printer?'))return;run(a+'-'+id,()=>adminPrinterAction(id,a))}
 // Phase 3: "Start jobs" renders from the order's payment gate. Awaiting payment
 // → disabled with an explanatory label; terminal → nothing; unknown → enabled
 // with the backend's server-side validation as the safety net.
 const productionCell=r=>{
  const gate=orderPaymentGate({status:r.status,next_step:r.next_step})
  if(gate==='terminal')return <span>—</span>
  if(gate==='awaiting_payment')return <button className="table-button" disabled title="This order is awaiting payment.">Needs payment first</button>
  return <button className="table-button" disabled={working} onClick={()=>start(r.id)}>Start jobs</button>
 }
 return <Shell kicker="MANUFACTURING" title="Operations control" description="Bring production, printers, materials and order actions into the browser." onRefresh={onRefresh} busy={busy||!!working}>
  {error&&<div className="workspace-error">{error}</div>}
  <div className="workspace-cards"><div className="mini-card"><strong>{dashboard?.production?.active_jobs||0}</strong><span>Active jobs</span></div><div className="mini-card"><strong>{dashboard?.production?.printing_jobs||0}</strong><span>Printing</span></div><div className="mini-card"><strong>{dashboard?.printers?.online||0}/{dashboard?.printers?.total||0}</strong><span>Printers online</span></div><div className="mini-card"><strong>{dashboard?.inventory?.low_filament||0}</strong><span>Low filament</span></div><div className="mini-card"><strong>{dashboard?.business?.pending_qc||0}</strong><span>QC pending</span></div></div>
  <div className="subsection"><h3>Production queue</h3><Table rows={dashboard?.production?.jobs||[]} columns={[{key:'product_name',label:'Job'},{key:'order_number',label:'Order'},{key:'printer_name',label:'Printer'},{key:'spool_name',label:'Material'},{key:'status',label:'Status'}]}/></div>
  <div className="subsection"><h3>Recent orders</h3><Table rows={dashboard?.recent_orders||[]} columns={[{key:'order_number',label:'Order',render:r=><button className="table-button" onClick={()=>setOrderId(r.id)}><strong>{r.order_number}</strong></button>},{key:'customer_name',label:'Customer'},{key:'status',label:'Status'},{key:'total_cents',label:'Total',render:r=>formatCents(r.total_cents)},{key:'action',label:'Production',render:productionCell}]}/></div>
  {orderId&&<AdminOrderDetail key={orderId} orderId={orderId} onClose={()=>{setOrderId(null);onRefresh()}} onStart={start} working={working}/>}
  <div className="subsection"><h3>Printers</h3><Table rows={dashboard?.printers?.items||[]} columns={[
   {key:'name',label:'Printer',render:r=><div><strong>{r.name}</strong><small>{r.model||'—'} · {r.connection_mode||'local'}</small></div>},
   {key:'status',label:'Status',render:r=><span className="pill">{r.status||r.octoprint_state_text||'Unknown'}</span>},
   {key:'nozzle_temp',label:'Nozzle',render:r=>r.nozzle_temp!=null?String(r.nozzle_temp)+'°C':'—'},
   {key:'bed_temp',label:'Bed',render:r=>r.bed_temp!=null?String(r.bed_temp)+'°C':'—'},
   {key:'file',label:'File',render:r=>r.octoprint_current_file||'—'},
   {key:'controls',label:'Controls',render:r=><div className="printer-controls">
     <button className="table-button" disabled={working} onClick={()=>preflight(r.id)}>Check</button>
     <button className="table-button" disabled={working} onClick={()=>action(r.id,'pause')}>Pause</button>
     <button className="table-button" disabled={working} onClick={()=>action(r.id,'resume')}>Resume</button>
     <button className="table-button danger-button" disabled={working} onClick={()=>action(r.id,'cancel')}>Cancel</button>
     <div className="printer-preheat"><input type="number" min="0" max="300" placeholder="Nozzle °C" value={targets[r.id]?.hotend||''} onChange={e=>setTargets(t=>({...t,[r.id]:{...t[r.id],hotend:e.target.value}}))}/><input type="number" min="0" max="130" placeholder="Bed °C" value={targets[r.id]?.bed||''} onChange={e=>setTargets(t=>({...t,[r.id]:{...t[r.id],bed:e.target.value}}))}/><button className="table-button" disabled={working} onClick={()=>preheat(r.id)}>Preheat</button></div>
   </div>}
  ]}/></div>
  {Object.entries(probe).map(([id,result])=><div className="workspace-detail printer-result" key={id}><div className="panel-head"><div><p className="admin-kicker">PRINTER CHECK</p><h3>{result.state||result.connection?.current?.state||'Printer response'}</h3><small>Live response for {id}</small></div></div><div className="workspace-cards"><div className="mini-card"><strong>{result.temperatures?.tool_actual??'—'}°C</strong><span>Nozzle</span></div><div className="mini-card"><strong>{result.temperatures?.bed_actual??'—'}°C</strong><span>Bed</span></div><div className="mini-card"><strong>{result.responding?'Responding':'—'}</strong><span>Firmware response</span></div></div></div>)}
 </Shell>
}

// ---------------------------------------------------------------------------
// Phase 5 — full action center: the uncapped action-items list (?all=true),
// split into "needs action" vs a collapsible "in progress" FYI section.
// Every item is a button that deep-links to the right workspace,
// pre-filtered to the entity (page/id come from the backend).
// ---------------------------------------------------------------------------
function Actions({items,onOpenItem}){
 const {needsAction,inProgress}=splitActionItems(items)
 const renderItem=a=><button className={'action '+(a.severity||'')} key={a.key||a.id||a.title} onClick={()=>onOpenItem&&onOpenItem(a)}><span>{a.title}</span><small>{a.detail}</small></button>
 return <Shell kicker="ATTENTION" title="Action center" description="Everything that needs a human — newest signals included. Pick an item to open the right workspace on the right record.">{needsAction.length?<><p className="admin-kicker">NEEDS ACTION · {needsAction.length}</p><div className="action-list">{needsAction.map(renderItem)}</div></>:<div className="workspace-empty">Nothing needs action right now.</div>}{inProgress.length>0&&<details className="action-fyi"><summary>In progress · {inProgress.length} FYI — nothing to do</summary><div className="action-list">{inProgress.map(renderItem)}</div></details>}</Shell>
}

export function AdminWorkspaces({active,dashboard,onRefresh,busy,onOpenQuote,quoteFocus,orderFocus,qcFocus,invoiceFocus,onOpenActionItem}){if(active==='actions')return <Actions items={dashboard?.action_items||[]} onOpenItem={onOpenActionItem}/>;if(active==='operations')return <Operations dashboard={dashboard} onRefresh={onRefresh} busy={busy} orderFocus={orderFocus}/>;if(active==='inventory')return <Inventory dashboard={dashboard}/>;if(active==='qc')return <QCWorkspace qcFocus={qcFocus}/>;if(active==='designs')return <DesignVault/>;if(active==='catalog')return <Catalog/>;if(active==='customers')return <Customers/>;if(active==='quotes')return <Quotes quoteFocus={quoteFocus}/>;if(active==='proofs')return <Proofs onOpenQuote={onOpenQuote}/>;if(active==='users')return <Users/>;if(active==='settings')return <SettingsPage/>;if(active==='invoices')return <Invoices invoiceFocus={invoiceFocus}/>;if(active==='fulfillment')return <Fulfillment/>;if(active==='health')return <Health/>;if(active==='ai')return <AI/>;if(active==='marketing')return <Marketing/>;return null}
