import React,{useEffect,useState} from 'react'
import {ArrowLeft,ArrowRight,Check,Clock,Download,FileText,XCircle} from 'lucide-react'
import {createRoot} from 'react-dom/client'
import {NotificationBell} from './notifications-ui.jsx'
import {customerApi,AUTH_TOKEN_KEY} from './api.js'
import {handleUnauthorized} from './auth.js'
import {formatCents} from './money.js'
import {getTheme,setTheme,initTheme} from './theme.js'
import CadPreview from './cad-preview.jsx'
initTheme()
import './styles.css'
import './quote.css'
const labels={draft:'Submitted',under_review:'Under review',sent:'Quote ready',accepted:'Accepted',declined:'Declined',expired:'Expired',approved:'Accepted'}
const proofLabels={draft:'Draft',sent:'Awaiting your review',changes_requested:'Changes requested',approved:'Approved',superseded:'Superseded'}
function formatDate(value){try{return new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}catch{return '—'}}
// Days until the quote expires. Date-only values are treated as end-of-day in
// the customer's local timezone. Returns null when no expiry is set.
function daysUntilExpiry(expiresAt){
 if(!expiresAt)return null
 const raw=String(expiresAt),padded=raw.length<=10?raw+'T23:59:59':raw,end=new Date(padded).getTime()
 if(Number.isNaN(end))return null
 return Math.ceil((end-Date.now())/86400000)
}
function proofFileKind(proof){
 const ext=String(proof?.asset_name||'').split('.').pop()?.toLowerCase()||''
 if(ext==='stl')return 'stl'
 if(['png','jpg','jpeg','webp'].includes(ext))return 'image'
 return 'file'
}
function ProofPreview({proof,openProof,action}){
 const kind=proofFileKind(proof)
 const [imgUrl,setImgUrl]=useState('')
 useEffect(()=>{
  if(kind!=='image')return
  let dead=false,url=''
  customerApi.proofFile(proof.id).then(blob=>{if(dead)return;url=URL.createObjectURL(blob);setImgUrl(url)}).catch(()=>{})
  return()=>{dead=true;if(url)URL.revokeObjectURL(url)}
 },[proof.id,kind])
 if(kind==='stl')return <div className="proof-inline"><CadPreview artifact={{url:'/api/v1/customer/proofs/'+proof.id+'/file',format:'stl'}}/></div>
 if(kind==='image')return <div className="proof-inline">{imgUrl?<img className="proof-image" src={imgUrl} alt="Design proof preview"/>:<p className="proof-loading">Loading preview…</p>}</div>
 return <button className="quote-button proof-file" disabled={action==='file'} onClick={()=>openProof(proof)}><Download size={15}/>{action==='file'?'Opening…':'Open proof file'}</button>
}
function App(){
 const token=typeof localStorage!=='undefined'?localStorage.getItem(AUTH_TOKEN_KEY):'',id=new URLSearchParams(location.search).get('id')||''
 const [data,setData]=useState(null),[proofs,setProofs]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(Boolean(token)),[action,setAction]=useState(''),[selectedVersion,setSelectedVersion]=useState(''),[reviewMode,setReviewMode]=useState(null),[changeComment,setChangeComment]=useState(''),[changeError,setChangeError]=useState(''),[orderId,setOrderId]=useState('')
 const load=async()=>{try{const [quoteData,proofData]=await Promise.all([customerApi.quote(id),customerApi.getProofs()]);setData(quoteData);const list=(proofData||[]).filter(p=>String(p.quote_id)===String(id)).sort((a,b)=>Number(b.design_version||0)-Number(a.design_version||0)||String(b.created_at||'').localeCompare(String(a.created_at||'')));setProofs(list);if(list[0])setSelectedVersion(v=>v||list[0].id);const status=String(quoteData?.quote?.status||'').toLowerCase();if(['accepted','approved'].includes(status)){try{const orders=await customerApi.orders();const all=orders?.orders||(Array.isArray(orders)?orders:[]);const match=all.find(o=>String(o.quote_id||'')===String(id));if(match)setOrderId(match.id)}catch{}}}catch(e){if(e?.status===401){handleUnauthorized();return}setError(e.message||'Quote unavailable.')}finally{setBusy(false)}}
 useEffect(()=>{if(!token){location.href='/account.html?return='+encodeURIComponent('/quote.html?id='+id);return}if(!id){setError('Quote not found.');setBusy(false);return}load()},[token,id])
 useEffect(()=>{if(!busy&&location.hash==='#proof'){const el=document.getElementById('proof');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}},[busy,proofs.length])
 const decide=async decision=>{setAction(decision);setError('');try{const result=decision==='accept'?await customerApi.acceptQuote(id):await customerApi.declineQuote(id);if(result?.order_id)location.href='/order.html?id='+encodeURIComponent(result.order_id);else await load()}catch(e){setError(e.message||'We could not update the quote.')}finally{setAction('')}}
 const approveProof=async()=>{const proof=proofs.find(p=>p.status==='sent');if(!proof)return;setAction('proof-approve');setError('');try{await customerApi.proofAction(proof.id,'approve','');await load()}catch(e){setError(e.message||'We could not approve the design proof.')}finally{setAction('')}}
 const submitChanges=async e=>{e.preventDefault();const proof=proofs.find(p=>p.status==='sent');if(!proof)return;const text=changeComment.trim();if(!text){setChangeError('Tell us what should change so we can revise the design.');return}setChangeError('');setAction('proof-changes');setError('');try{await customerApi.proofAction(proof.id,'request-changes',text);setChangeComment('');setReviewMode(null);await load()}catch(e){setError(e.message||'We could not send your change request.')}finally{setAction('')}}
 const requestUpdated=async()=>{setAction('renew');setError('');try{const items=data?.items||[],first=items[0]||{},quote=data?.quote||{};const idea=[quote.notes,...items.map(i=>i.description)].filter(Boolean).join(' · ')||'Custom project';const result=await customerApi.createQuote({project:{idea:('Follow-up request for expired quote '+(quote.quote_number||'')+': '+idea).slice(0,4000),dimensions:'',material:first.material||'',quantity:Number(first.quantity)||1,notes:'Original quote '+(quote.quote_number||'')+' expired. Please re-quote.'}});const newId=result?.quote?.id;if(newId)location.href='/quote.html?id='+encodeURIComponent(newId);else setError('We started your request but could not open it. Check your account for the new quote.')}catch(e){setError(e.message||'We could not start an updated request.')}finally{setAction('')}}
 const openProof=async proof=>{setAction('file');setError('');try{const blob=await customerApi.proofFile(proof.id);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.download=proof.asset_name||'fabvex-proof';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){setError(e.message||'Proof file is unavailable.')}finally{setAction('')}}
 if(busy)return <div className="quote-shell"><div className="quote-loading">Loading quote…</div></div>
 const quote=data?.quote,items=data?.items||[]
 if(error&&!quote)return <div className="quote-shell"><main className="quote-main"><a href="/account.html"><ArrowLeft size={16}/> Back to account</a><div className="quote-missing"><XCircle size={32}/><h1>Quote unavailable.</h1><p>{error}</p></div></main></div>
 if(!quote)return null
 const status=String(quote.status||'draft').toLowerCase(),daysLeft=daysUntilExpiry(quote.expires_at),expired=status==='expired'||(daysLeft!=null&&daysLeft<0),canDecide=status==='sent'&&!expired,canPay=(status==='accepted'||status==='approved')&&!expired
 const sortedProofs=proofs,latestProof=sortedProofs[0],previewProof=sortedProofs.find(p=>p.id===selectedVersion)||latestProof,awaitingProof=latestProof?.status==='sent',changesPending=latestProof?.status==='changes_requested'
 const heroTitle=expired?'This quote has expired.':status==='declined'?"You've declined this quote.":canDecide?'Your quote is ready.':'Your project is in progress.'
 return <div className="quote-shell"><header className="quote-nav"><a className="brand" href="/"><span className="brand-mark"><img src="/brand/fabvex-mark.svg" alt=""/></span><span>FAB<span>VEX</span></span></a><div><NotificationBell/><button className="quote-theme" onClick={()=>setTheme(getTheme()==='dark'?'light':'dark')}>Theme</button><a href="/account.html">My account</a></div></header><main className="quote-main"><a className="quote-back" href="/account.html"><ArrowLeft size={16}/> Back to account</a><section className="quote-hero"><div><p className="quote-kicker">QUOTE {quote.quote_number}</p><h1>{heroTitle}</h1><p>This is the current FABVEX quote for your project.</p></div><span className={'quote-status '+status}>{labels[status]||'In progress'}</span></section>
 {quote.expires_at&&!expired&&<div className={'quote-expiry'+(daysLeft!=null&&daysLeft<=3?' warn':'')}><Clock size={15}/><span><strong>Quote valid until {formatDate(quote.expires_at)}</strong>{daysLeft!=null&&(daysLeft<=3?` — expires in ${daysLeft} day${daysLeft===1?'':'s'}.`:' — prices are locked in until then.')}</span></div>}
 {expired&&<div className="quote-expiry expired"><XCircle size={15}/><div><span><strong>This quote expired on {formatDate(quote.expires_at)}.</strong> Pricing may have changed since — request an updated quote and we'll re-price your project.</span><button className="quote-button accept" disabled={!!action} onClick={requestUpdated}>{action==='renew'?'Starting…':<>Request an updated quote <ArrowRight size={16}/></>}</button></div></div>}
 <div className="quote-grid"><section className="quote-panel"><div className="quote-panel-head"><div><span>QUOTE DETAILS</span><h2>What we're making</h2></div><FileText size={19}/></div><div className="quote-items">{items.map((item,i)=><div className="quote-item" key={item.id||i}><div><strong>{item.description||'Custom part'}</strong><small>{item.quantity} × {[item.material,item.color].filter(Boolean).join(' · ')||'Material to be determined'}</small></div><b>{formatCents(Number(item.unit_price_cents||0)*Number(item.quantity||1))}</b></div>)}</div><div className="quote-total"><span>Total</span><strong>{formatCents(quote.total_cents)}</strong></div>{quote.notes&&<div className="quote-notes"><span>PROJECT NOTES</span><p>{quote.notes}</p></div>}</section><section className="quote-panel"><div className="quote-panel-head"><div><span>WHAT HAPPENS NEXT</span><h2>Before production</h2></div><Clock size={19}/></div><ol className="quote-steps"><li className={status==='sent'?'current':''}><span>01</span><div><strong>You review the quote</strong><small>Confirm the price and scope match what you need.</small></div></li><li className={status==='accepted'||status==='approved'?'current':''}><span>02</span><div><strong>You accept it</strong><small>Acceptance turns the approved quote into the next order step.</small></div></li><li className={awaitingProof||latestProof?.status==='approved'?'current':''}><span>03</span><div><strong>Design proof, when required</strong><small>For custom design work, production waits for your proof approval.</small></div></li></ol>{error&&<p className="quote-error">{error}</p>}{canDecide&&<div className="quote-actions"><button className="quote-button accept" disabled={!!action} onClick={()=>decide('accept')}>{action==='accept'?'Accepting…':<>Accept Quote <Check size={16}/></>}</button><button className="quote-button decline" disabled={!!action} onClick={()=>decide('decline')}>{action==='decline'?'Declining…':<>Decline <XCircle size={16}/></>}</button></div>}{canPay&&<a className="quote-button accept" href={orderId?'/order.html?id='+encodeURIComponent(orderId):'/orders.html'}>{orderId?'View my order':'View my orders'} <ArrowRight size={16}/></a>}{status==='declined'&&<a className="quote-button accept" href="/custom-work.html">Start a new request <ArrowRight size={16}/></a>}</section></div>
 {previewProof&&<section className="quote-panel quote-proof-panel" id="proof"><div className="quote-panel-head"><div><span>DESIGN REVIEW</span><h2>{awaitingProof?'Please approve your design proof.':proofLabels[latestProof?.status]?proofLabels[latestProof.status]+' — design proof':'Design proof'}</h2></div><FileText size={19}/></div>
 {sortedProofs.length>1&&<div className="proof-versions" role="tablist" aria-label="Proof versions">{sortedProofs.map(p=><button key={p.id} role="tab" aria-selected={p.id===previewProof.id} className={'proof-version-tab'+(p.id===previewProof.id?' active':'')} onClick={()=>setSelectedVersion(p.id)}>V{p.design_version}<small>{proofLabels[p.status]||p.status}</small></button>)}</div>}
 <div className="proof-meta"><div><strong>Version {previewProof.design_version}</strong><small>{proofLabels[previewProof.status]||previewProof.status}{previewProof.sent_at?' · Sent '+formatDate(previewProof.sent_at):''}</small></div></div>
 <ProofPreview proof={previewProof} openProof={openProof} action={action}/>
 {previewProof.customer_note&&<div className="quote-notes"><span>NOTE FROM FABVEX</span><p>{previewProof.customer_note}</p></div>}
 {previewProof.customer_comment&&<div className="quote-notes proof-change-request"><span>YOUR CHANGE REQUEST</span><p>{previewProof.customer_comment}</p></div>}
 {/* COPY (static): expected-response line for the proof panel. Not a computed SLA — Phase 1 copy. */}
 <p className="proof-sla">We typically respond within 2 business days.</p>
 {awaitingProof&&reviewMode!=='changes'&&<div className="quote-actions"><button className="quote-button accept" disabled={!!action} onClick={approveProof}>{action==='proof-approve'?'Approving…':<>Approve proof <Check size={16}/></>}</button><button className="quote-button decline" disabled={!!action} onClick={()=>{setReviewMode('changes');setChangeError('')}}><>Request changes <XCircle size={16}/></></button></div>}
 {awaitingProof&&reviewMode==='changes'&&<form className="proof-changes-form" onSubmit={submitChanges}><label className="proof-comment">What should we change? <span className="required-star">Required</span><textarea value={changeComment} onChange={e=>setChangeComment(e.target.value)} placeholder="Describe exactly what needs to change — dimensions, features, material, finish…"/></label>{changeError&&<p className="quote-error">{changeError}</p>}<div className="quote-actions"><button className="quote-button decline" type="submit" disabled={action==='proof-changes'}>{action==='proof-changes'?'Sending…':<>Send change request <XCircle size={16}/></>}</button><button className="quote-button proof-file" type="button" onClick={()=>{setReviewMode(null);setChangeComment('');setChangeError('')}}>Cancel</button></div></form>}
 {changesPending&&<p className="proof-pending-note">Thanks — we've got your change request and are working on a revised proof. We'll notify you when it's ready to review.</p>}
 </section>}</main></div>
}
createRoot(document.getElementById('quote-root')).render(<App/>)
