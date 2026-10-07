import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If VITE_API_URL/VITE_API_BASE_URL points at a non-local origin, that origin
// must be allow-listed in the CSP connect-src directive, or the browser will
// silently block every API call. Same-origin (default) and localhost builds
// leave the meta tag untouched.
function cspConnectSrc(){
  const raw=(process.env.VITE_API_URL||process.env.VITE_API_BASE_URL||'').trim()
  let extra=''
  try{
    const url=new URL(raw)
    if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))extra=' '+url.origin
  }catch(_){/* relative or empty -> same-origin, nothing to add */}
  return {
    name:'fabos-csp-connect-src',
    transformIndexHtml(html){
      if(!extra)return html
      return html.replace(/connect-src ([^";]+)/,(m,srcs)=>`connect-src ${srcs}${extra}`)
    },
  }
}

export default defineConfig({
  base:'./',
  plugins:[react(),cspConnectSrc()],
  server:{port:5173},
  build:{rollupOptions:{input:{main:'index.html',custom:'custom-work.html',product:'product.html',checkout:'checkout.html',shop:'shop.html',orders:'orders.html',order:'order.html',account:'account.html',quote:'quote.html',admin:'admin.html',about:'about.html',faq:'faq.html'}}}
})
