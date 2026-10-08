import React,{useCallback,useEffect,useState} from 'react'
import {ArrowLeft,ArrowRight,BellRing,CheckCircle2} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {customerApi} from './api.js'
import {getToken,handleUnauthorized} from './auth.js'
import {deepLinkFor,formatNotificationTime} from './notifications-ui.jsx'
import {initTheme} from './theme.js'
initTheme()
import './styles.css'
import './notifications.css'

// Defensive client-side ordering: unread first, then newest. The API returns
// unread-first, but the row order must not depend on that.
function sortNotifications(items){
 const list=Array.isArray(items)?[...items]:[]
 return list.sort((a,b)=>{
  const ua=a?.read_at||a?.is_read||a?.read?0:1,ub=b?.read_at||b?.is_read||b?.read?0:1
  if(ub!==ua)return ub-ua
  return String(b?.created_at||'').localeCompare(String(a?.created_at||''))
 })
}
function isUnread(n){
 return !(n?.read_at||n?.is_read||n?.read)
}

function App(){
 const token=getToken()
 const [items,setItems]=useState([]),[busy,setBusy]=useState(Boolean(token)),[error,setError]=useState(''),[marking,setMarking]=useState(false),[markingId,setMarkingId]=useState('')
 const load=useCallback(async()=>{
  try{
   setError('')
   const list=await customerApi.notifications.list({limit:100})
   setItems(sortNotifications(list))
  }catch(e){
   if(e?.status===401){handleUnauthorized();return}
   setError(e?.message||'We could not load your notifications.')
  }
 },[])
 useEffect(()=>{
  if(!token){setBusy(false);return}
  load().finally(()=>setBusy(false))
 },[token,load])
 const openNotification=async n=>{
  const link=deepLinkFor(n)
  const id=n?.id
  if(id!=null&&id!==''){
   setMarkingId(String(id))
   try{await customerApi.notifications.markRead(id)}catch(e){if(e?.status===401){handleUnauthorized();return}}
   setMarkingId('')
   setItems(list=>list.map(x=>String(x.id)===String(id)?{...x,read_at:x.read_at||new Date().toISOString(),is_read:true}:x))
  }
  if(link)window.location.href=link
 }
 const markAll=async()=>{
  setMarking(true);setError('')
  try{
   await customerApi.notifications.markAllRead()
   setItems(list=>list.map(x=>({...x,read_at:x.read_at||new Date().toISOString(),is_read:true})))
  }catch(e){
   if(e?.status===401){handleUnauthorized();return}
   setError(e?.message||'We could not mark your notifications as read.')
  }finally{setMarking(false)}
 }
 const unreadCount=items.filter(isUnread).length
 return <div className="notif-shell">
  <header className="notif-nav">
   <a className="brand" href="/"><span className="brand-mark"><img src="/brand/fabvex-mark.svg" alt=""/></span><span>FAB<span>VEX</span></span></a>
   <nav><a href="/account.html">My account</a></nav>
  </header>
  <main className="notif-main">
   <a className="back-link" href="/account.html" style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:18,color:'var(--muted)',fontSize:13}}><ArrowLeft size={15}/> Back to account</a>
   <div className="notif-head">
    <div>
     <p className="eyebrow">NOTIFICATION CENTER</p>
     <h1>Your updates.</h1>
     <p>{unreadCount>0?`${unreadCount} unread notification${unreadCount===1?'':'s'} — newest and unread first.`:'Everything is up to date.'}</p>
    </div>
    <div className="notif-actions">
     {unreadCount>0&&<button className="button secondary" type="button" onClick={markAll} disabled={marking}>{marking?'Marking…':'Mark all read'}</button>}
    </div>
   </div>
   {busy?<div className="notif-state"><h2>Loading your notifications…</h2><p>Checking for new updates.</p></div>
   :!token?<div className="notif-state"><BellRing size={30}/><h2>Sign in to see your notifications.</h2><p>Quote, proof, and order updates appear here once you're signed in.</p><a className="button primary" href="/account.html?return=%2Fnotifications.html">Sign in <ArrowRight size={16}/></a></div>
   :error?<div className="notif-state"><h2>We couldn't load your notifications.</h2><p>{error}</p><button className="button secondary" onClick={()=>{setBusy(true);load().finally(()=>setBusy(false))}}>Try again</button></div>
   :items.length===0?<div className="notif-empty"><CheckCircle2 size={34}/><h2>You're all caught up.</h2><p>New quotes, design proofs, and order updates will appear here.</p><a className="button primary" href="/account.html">Back to account <ArrowRight size={16}/></a></div>
   :<ul className="notif-list">
    {items.map(n=>{
     const unread=isUnread(n),link=deepLinkFor(n),key=String(n?.id??n?.created_at??Math.random())
     return <li key={key}>
      <button type="button" className={'notif-row'+(unread?' unread':'')} onClick={()=>openNotification(n)} disabled={markingId===String(n?.id)} aria-label={`${n?.title||'Notification'}${unread?' (unread)':''}`}>
       <span className="notif-dot" aria-hidden="true"/>
       <span className="notif-copy">
        <strong>{n?.title||'Update'}</strong>
        {n?.body&&<p>{n.body}</p>}
       </span>
       <span className="notif-meta">
        <span className="notif-time">{formatNotificationTime(n?.created_at)}</span>
        {link&&<ArrowRight size={16} className="notif-link-arrow"/>}
       </span>
      </button>
     </li>
    })}
   </ul>}
  </main>
 </div>
}
createRoot(document.getElementById('notifications-root')).render(<App/>)
