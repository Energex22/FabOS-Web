
import React,{useEffect,useState} from 'react'
import {Brain,RefreshCw,Save,Package,Factory,Store,Settings,Activity} from 'lucide-react'
import {getAdminCatalog,getAdminCustomers,getAdminQuotes,getAdminUsers,getAdminPermissions,getAdminSettings,getAdminInvoices,getAdminInvoice,getAdminFulfillments,getAdminFulfillment,getSystemHealth,updateAdminStorefront,createAdminCustomer,updateAdminQuote,updateAdminSetting,getAdminAiStatus,sendAdminAiMessage,getAdminMarketingDashboard,getAdminMarketingProviders,getAdminMarketingPosts,approveAdminMarketingPost,queueAdminMarketingPosts,startAdminProduction,getAdminDesigns,getAdminDesign,getAdminQc,getAdminQcDetail,updateAdminQc,reconcileAdminQc,adminPrinterPreflight,adminPrinterPreheat,adminPrinterAction} from './api.js'
import './admin-workspaces.css'

const money=c=>(Number(c||0)/100).toLocaleString(undefined,{style:'currency',currency:'USD'})
const date=v=>v?new Date(v).toLocaleString():'—'
function Shell({kicker,title,description,onRefresh,busy,children}){return <section className="workspace"><div className="workspace-head"><div><p className="admin-kicker">{kicker}</p><h2>{title}</h2><p>{description}</p></div>{onRefresh&&<button className="admin-ghost" onClick={onRefresh} disabled={busy}><RefreshCw size={15} className={busy?'spin':''}/> Refresh</button>}</div>{children}</section>}
function Table({rows,columns,empty='Nothing to show.'}){if(!rows?.length)return <div className="workspace-empty">{empty}</div>;return <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||r.quote_number||r.username||i}>{columns.map(c=><td key={c.key}>{c.render?c.render(r):r[c.key]??'—'}</td>)}</tr>)}</tbody></table></div>}

function Catalog(){
 const [data,setData]=useState(null),[q,setQ]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminCatalog(q));setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 const publish=async r=>{try{await updateAdminStorefront(r.product.id,{visibility:r.storefront?.visibility==='published'?'draft':'published'});await load()}catch(e){setError(e.message)}}
 return <Shell kicker="CATALOG" title="Products & storefront" description="Manage the catalog already backed by FabOS." onRefresh={load} busy={busy}><div className="workspace-toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products…"/><button className="admin-primary" onClick={load}>Search</button></div>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.products||[]} columns={[{key:'name',label:'Product',render:r=><div><strong>{r.product?.name||r.product?.sku||r.product?.id}</strong><small>{r.product?.sku||'No SKU'} · {r.product?.category||'Other'}</small></div>},{key:'price',label:'Price',render:r=>money(r.product?.price_cents)},{key:'visibility',label:'Visibility',render:r=><span className="pill">{r.storefront?.visibility||'draft'}</span>},{key:'ready',label:'Readiness',render:r=>r.storefront?.ready?'Ready':'Needs work'},{key:'action',label:'Action',render:r=><button className="table-button" onClick={()=>publish(r)}>{r.storefront?.visibility==='published'?'Unpublish':'Publish'}</button>}]}/></Shell>
}

function Customers(){
 const [data,setData]=useState(null),[form,setForm]=useState({name:'',email:'',phone:''}),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminCustomers());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const add=async e=>{e.preventDefault();setBusy(true);try{await createAdminCustomer(form);setForm({name:'',email:'',phone:''});await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="CUSTOMERS" title="Customer relationships" description="Manage customer records from the browser." onRefresh={load} busy={busy}><form className="inline-form" onSubmit={add}><input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><button className="admin-primary">Add customer</button></form>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.customers||[]} columns={[{key:'name',label:'Customer',render:r=><div><strong>{r.name||'Unnamed'}</strong><small>{r.email||'No email'}</small></div>},{key:'phone',label:'Phone'},{key:'created_at',label:'Created',render:r=>date(r.created_at)}]}/></Shell>
}

function Quotes(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminQuotes());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const send=async r=>{setBusy(true);try{await updateAdminQuote(r.id,{status:'sent'});await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="SALES" title="Quotes" description="Review and advance quote workflow." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.quotes||[]} columns={[{key:'quote_number',label:'Quote',render:r=><strong>{r.quote_number||r.id}</strong>},{key:'customer',label:'Customer',render:r=>r.customer_name||r.customer_email||r.customer_id||'—'},{key:'status',label:'Status',render:r=><span className="pill">{r.status}</span>},{key:'total',label:'Total',render:r=>money(r.total_cents)},{key:'action',label:'Action',render:r=><div className="button-row">{r.status==='draft'&&<button className="table-button" onClick={()=>send(r)}>Send</button>}<a className="table-button" href={'/quote.html?id='+encodeURIComponent(r.id)}>Open</a></div>}]}/></Shell>
}

function Users(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{const [u,p]=await Promise.all([getAdminUsers(),getAdminPermissions()]);setData({...u,permissions:p});setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 return <Shell kicker="SYSTEM" title="Team & permissions" description="Inspect the user and permission model enforced by FabOS." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<div className="workspace-cards"><div className="mini-card"><strong>{data?.users?.length||0}</strong><span>Users</span></div><div className="mini-card"><strong>{data?.permissions?.permissions?.length||0}</strong><span>Permissions</span></div></div><Table rows={data?.users||[]} columns={[{key:'username',label:'User',render:r=><div><strong>{r.username||r.email}</strong><small>{r.email||'—'}</small></div>},{key:'account_type',label:'Account'},{key:'role',label:'Role'},{key:'active',label:'Active',render:r=>r.active?'Yes':'No'},{key:'last_login_at',label:'Last login',render:r=>date(r.last_login_at)}]}/></Shell>
}

function SettingsPage(){
 const [data,setData]=useState(null),[selected,setSelected]=useState(''),[value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{const d=await getAdminSettings();setData(d);const k=Object.keys(d.settings||{})[0]||'';setSelected(k);setValue(String(d.settings?.[k]??''));setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 useEffect(()=>{if(selected&&data)setValue(String(data.settings?.[selected]??''))},[selected])
 const save=async()=>{setBusy(true);try{await updateAdminSetting(selected,value);await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const keys=Object.keys(data?.settings||{})
 return <Shell kicker="SYSTEM" title="Settings center" description="Browser access to validated shop settings." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}{keys.length?<div className="settings-editor"><label>Setting<select value={selected} onChange={e=>setSelected(e.target.value)}>{keys.map(k=><option key={k}>{k}</option>)}</select></label><label>Value<textarea value={value} onChange={e=>setValue(e.target.value)} rows={5}/></label><button className="admin-primary" onClick={save} disabled={busy}><Save size={15}/> Save setting</button></div>:<div className="workspace-empty">No settings exposed.</div>}</Shell>
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

function Invoices(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null)
 const load=async()=>{setBusy(true);try{setData(await getAdminInvoices());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const open=async id=>{setBusy(true);try{setSelected(await getAdminInvoice(id))}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="BILLING" title="Invoices & payments" description="Review invoices and payment history without leaving the operations console." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.invoices||[]} columns={[{key:'invoice_number',label:'Invoice',render:r=><strong>{r.invoice_number||r.number||r.id}</strong>},{key:'customer_name',label:'Customer',render:r=>r.customer_name||r.customer_email||r.customer_id||'—'},{key:'status',label:'Status',render:r=><span className="pill">{r.status||'—'}</span>},{key:'total_cents',label:'Total',render:r=>money(r.total_cents||r.amount_cents)},{key:'due_at',label:'Due',render:r=>date(r.due_at)},{key:'action',label:'Details',render:r=><button className="table-button" onClick={()=>open(r.id)}>View</button>}]}/>{selected&&<div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">INVOICE DETAIL</p><h3>{selected.invoice?.invoice_number||selected.invoice?.number||selected.invoice?.id}</h3></div><button className="table-button" onClick={()=>setSelected(null)}>Close</button></div><pre>{JSON.stringify(selected,null,2)}</pre></div>}</Shell>
}

function Fulfillment(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null)
 const load=async()=>{setBusy(true);try{setData(await getAdminFulfillments());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 const open=async id=>{setBusy(true);try{setSelected(await getAdminFulfillment(id))}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Shell kicker="FULFILLMENT" title="Shipping & fulfillment" description="Track fulfillment records and drill into shipment details from the browser." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<Table rows={data?.fulfillments||[]} columns={[{key:'order_number',label:'Order',render:r=><strong>{r.order_number||r.order_id||'—'}</strong>},{key:'status',label:'Status',render:r=><span className="pill">{r.status||'—'}</span>},{key:'carrier',label:'Carrier',render:r=>r.carrier||'—'},{key:'tracking_number',label:'Tracking',render:r=>r.tracking_number||r.tracking||'—'},{key:'shipped_at',label:'Shipped',render:r=>date(r.shipped_at)},{key:'action',label:'Details',render:r=><button className="table-button" onClick={()=>open(r.id)}>View</button>}]}/>{selected&&<div className="workspace-detail"><div className="panel-head"><div><p className="admin-kicker">FULFILLMENT DETAIL</p><h3>{selected.fulfillment?.order_number||selected.fulfillment?.order_id||selected.fulfillment?.id}</h3></div><button className="table-button" onClick={()=>setSelected(null)}>Close</button></div><pre>{JSON.stringify(selected,null,2)}</pre></div>}</Shell>
}

function Health(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getSystemHealth());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[])
 return <Shell kicker="SYSTEM" title="Health & diagnostics" description="Verify the live API boundary and surface its reported service state." onRefresh={load} busy={busy}>{error&&<div className="workspace-error">{error}</div>}<div className="workspace-cards"><div className="mini-card"><strong>{data?.status||'—'}</strong><span>API status</span></div><div className="mini-card"><strong>{data?.version||'—'}</strong><span>API version</span></div><div className="mini-card"><strong>{data?.service||'FabOS'}</strong><span>Service</span></div></div><pre className="health-json">{data?JSON.stringify(data,null,2):'No health response yet.'}</pre></Shell>
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

function QCWorkspace(){
 const [data,setData]=useState(null),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const load=async()=>{setBusy(true);try{setData(await getAdminQc());setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 const open=async id=>{setBusy(true);try{const d=await getAdminQcDetail(id);const inspection=d.inspection||{};let items=[];try{items=JSON.parse(inspection.checklist_json||'[]')}catch{};setSelected({...inspection,checklist:inspection.checklist||items,notes:inspection.notes||''});setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
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

function Operations({dashboard,onRefresh,busy}){
 const [error,setError]=useState(''),[working,setWorking]=useState(null),[targets,setTargets]=useState({}),[probe,setProbe]=useState({})
 const run=async(key,fn)=>{setWorking(key);try{const d=await fn();if(d?.result)setProbe(p=>({...p,[key]:d.result});await onRefresh();setError('')}catch(e){setError(e.message)}finally{setWorking(null)}}
 const start=async id=>run('order-'+id,()=>startAdminProduction(id))
 const preflight=id=>run('probe-'+id,()=>adminPrinterPreflight(id))
 const preheat=(id)=>run('heat-'+id,()=>adminPrinterPreheat(id,targets[id]?.hotend||null,targets[id]?.bed||null))
 const action=(id,a)=>{if(a==='cancel'&&!window.confirm('Cancel the active print on this printer?'))return;run(a+'-'+id,()=>adminPrinterAction(id,a))}
 return <Shell kicker="MANUFACTURING" title="Operations control" description="Bring production, printers, materials and order actions into the browser." onRefresh={onRefresh} busy={busy||!!working}>
  {error&&<div className="workspace-error">{error}</div>}
  <div className="workspace-cards"><div className="mini-card"><strong>{dashboard?.production?.active_jobs||0}</strong><span>Active jobs</span></div><div className="mini-card"><strong>{dashboard?.production?.printing_jobs||0}</strong><span>Printing</span></div><div className="mini-card"><strong>{dashboard?.printers?.online||0}/{dashboard?.printers?.total||0}</strong><span>Printers online</span></div><div className="mini-card"><strong>{dashboard?.inventory?.low_filament||0}</strong><span>Low filament</span></div><div className="mini-card"><strong>{dashboard?.business?.pending_qc||0}</strong><span>QC pending</span></div></div>
  <div className="subsection"><h3>Production queue</h3><Table rows={dashboard?.production?.jobs||[]} columns={[{key:'product_name',label:'Job'},{key:'order_number',label:'Order'},{key:'printer_name',label:'Printer'},{key:'spool_name',label:'Material'},{key:'status',label:'Status'}]}/></div>
  <div className="subsection"><h3>Recent orders</h3><Table rows={dashboard?.recent_orders||[]} columns={[{key:'order_number',label:'Order'},{key:'customer_name',label:'Customer'},{key:'status',label:'Status'},{key:'total_cents',label:'Total',render:r=>money(r.total_cents)},{key:'action',label:'Production',render:r=>!['completed','cancelled'].includes(String(r.status).toLowerCase())?<button className="table-button" disabled={working} onClick={()=>start(r.id)}>Start jobs</button>:<span>—</span>}]}/></div>
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

export function AdminWorkspaces({active,dashboard,onRefresh,busy}){if(active==='operations')return <Operations dashboard={dashboard} onRefresh={onRefresh} busy={busy}/>;if(active==='inventory')return <Inventory dashboard={dashboard}/>;if(active==='qc')return <QCWorkspace/>;if(active==='designs')return <DesignVault/>;if(active==='catalog')return <Catalog/>;if(active==='customers')return <Customers/>;if(active==='quotes')return <Quotes/>;if(active==='users')return <Users/>;if(active==='settings')return <SettingsPage/>;if(active==='invoices')return <Invoices/>;if(active==='fulfillment')return <Fulfillment/>;if(active==='health')return <Health/>;if(active==='ai')return <AI/>;if(active==='marketing')return <Marketing/>;return null}
