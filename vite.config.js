import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base:'./',
  plugins:[react()],
  server:{port:5173},
  build:{rollupOptions:{input:{main:'index.html',custom:'custom-work.html',product:'product.html',checkout:'checkout.html',shop:'shop.html',orders:'orders.html',order:'order.html',account:'account.html',about:'about.html',faq:'faq.html'}}}
})
