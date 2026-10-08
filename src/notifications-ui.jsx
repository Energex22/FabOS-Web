import React,{useEffect,useState} from 'react'
import {Bell} from 'lucide-react'
import {customerApi} from './api.js'
import {getToken} from './auth.js'
import './notifications.css'

const POLL_INTERVAL_MS=60000

// Site-nav bell: shows the unread notification count for signed-in customers.
// Fetches on mount, then re-fetches every 60s only while the tab is visible.
// Hidden entirely for guests and when there is nothing unread.
export function NotificationBell(){
 const token=getToken()
 const [count,setCount]=useState(null)
 useEffect(()=>{
  if(!token)return undefined
  let alive=true,timer=null
  const refresh=async()=>{
   try{
    const n=await customerApi.notifications.unreadCount()
    if(alive)setCount(Number(n)||0)
   }catch{
    // Keep a stale count; never render a phantom badge from an error.
    if(alive&&count===null)setCount(0)
   }
  }
  const tick=()=>{if(document.visibilityState==='visible')refresh()}
  refresh()
  timer=setInterval(tick,POLL_INTERVAL_MS)
  document.addEventListener('visibilitychange',tick)
  return ()=>{alive=false;if(timer)clearInterval(timer);document.removeEventListener('visibilitychange',tick)}
 },[token])
 if(!token)return null
 const shown=count>99?'99+':count
 return <a className="notif-bell" href="/notifications.html" aria-label={count>0?`Notifications, ${count} unread`:'Notifications'}>
  <Bell size={18}/>{count>0&&<span className="notif-badge" aria-hidden="true">{shown}</span>}
 </a>
}

// Deep-link resolution for a notification row. Proof events land on the proof
// anchor (Phase 1 scroll behavior handles the reveal); everything else opens
// the linked quote or order page.
export function deepLinkFor(n){
 const direct=n?.link_url||n?.url||n?.deep_link
 if(direct)return String(direct)
 const quoteId=n?.quote_id||n?.quoteId||''
 const orderId=n?.order_id||n?.orderId||''
 const kind=String(n?.event||n?.type||'').toLowerCase()
 const isProof=kind.includes('proof')||Boolean(n?.proof_id||n?.proofId)
 if(isProof&&quoteId)return `/quote.html?id=${encodeURIComponent(quoteId)}#proof`
 if(quoteId)return `/quote.html?id=${encodeURIComponent(quoteId)}`
 if(orderId)return `/order.html?id=${encodeURIComponent(orderId)}`
 return ''
}

export function formatNotificationTime(value){
 if(!value)return ''
 const date=new Date(value)
 if(Number.isNaN(date.getTime()))return ''
 const diff=Date.now()-date.getTime()
 const minutes=Math.floor(diff/60000)
 if(minutes<1)return 'Just now'
 if(minutes<60)return `${minutes}m ago`
 const hours=Math.floor(minutes/60)
 if(hours<24)return `${hours}h ago`
 const days=Math.floor(hours/24)
 if(days<7)return `${days}d ago`
 return date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})
}
