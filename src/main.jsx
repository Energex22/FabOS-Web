import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Box, Check, ChevronDown, Menu, Minus, Plus, ShoppingCart, Sparkles, X } from 'lucide-react'
import './styles.css'

const products = [
  { name: 'Desk Cable Dock', price: '$18', tag: 'Best Seller', description: 'A clean, compact home for the cables that never stay put.' },
  { name: 'Controller Stand', price: '$24', tag: 'Popular', description: 'Weighted, low-profile support built for everyday use.' },
  { name: 'Headphone Hook', price: '$16', tag: 'New', description: 'A simple under-desk mount that keeps your setup clear.' },
]

const categories = ['All', 'Desk & Office', 'Gaming', 'Home', 'Custom']

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cart, setCart] = useState(0)
  const [category, setCategory] = useState('All')
  const [openFaq, setOpenFaq] = useState(0)

  const addToCart = () => setCart((count) => count + 1)

  return (
    <div className="site-shell">
      <header className="nav">
        <a className="brand" href="#top" aria-label="FabOS home">
          <span className="brand-mark"><Box size={18} strokeWidth={2.4} /></span>
          <span>FAB<span>OS</span></span>
        </a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
          <a href="#custom" onClick={() => setMenuOpen(false)}>Custom Work</a>
          <a href="#process" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <div className="nav-actions">
          <button className="cart" aria-label="Shopping cart" onClick={() => alert(`You have ${cart} item${cart === 1 ? '' : 's'} in your cart.`)}>
            <ShoppingCart size={19} />
            {cart > 0 && <span>{cart}</span>}
          </button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} /> BUILT FOR REAL LIFE</p>
            <h1>3D printed.<br /><em>Engineered</em> for you.</h1>
            <p className="hero-text">Useful things, custom solutions, and one-off ideas brought to life with precision 3D printing.</p>
            <div className="hero-buttons">
              <a className="button primary" href="#shop">Shop Projects <ArrowRight size={17} /></a>
              <a className="button secondary" href="#custom">Need something custom?</a>
            </div>
            <div className="trust-row">
              <span><Check size={15} /> Made to order</span>
              <span><Check size={15} /> Quality checked</span>
              <span><Check size={15} /> Ships with care</span>
            </div>
          </div>
          <div className="hero-object" aria-hidden="true">
            <div className="object-ring ring-one" />
            <div className="object-ring ring-two" />
            <div className="floating-cube"><Box size={76} strokeWidth={1.1} /></div>
            <div className="object-label">PRECISION<br /><strong>MADE</strong></div>
          </div>
        </section>

        <section className="process" id="process">
          <div className="section-heading centered"><p className="eyebrow">HOW IT WORKS</p><h2>From idea to <em>finished part.</em></h2></div>
          <div className="steps">
            {[['01', 'Choose or create', 'Pick a ready-to-print project or tell us what you need.'], ['02', 'We make it real', 'We prepare, print, inspect, and finish your part.'], ['03', 'It shows up', 'Your finished piece is packed carefully and shipped to you.']].map(([number, title, text]) => (
              <div className="step" key={number}><div className="step-number">{number}</div><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading"><p className="eyebrow">POPULAR PROJECTS</p><h2>Things worth <em>printing.</em></h2><p>Start with something useful. Everything here is designed to be practical, durable, and good-looking.</p></div>
          <div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-image"><div className="product-shape"><Box size={58} strokeWidth={1.2} /></div><span>{product.tag}</span></div>
                <div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>{product.price}</strong></div>
                <button className="add-button" onClick={addToCart}>Add to cart <Plus size={16} /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="custom" id="custom">
          <div className="custom-panel">
            <div className="custom-copy"><p className="eyebrow">CUSTOM WORK</p><h2>Have an idea?<br /><em>Let's build it.</em></h2><p>From a replacement part to a completely original creation, custom printing is where we get to make something that doesn't exist yet.</p><a className="button light" href="#contact">Start a custom project <ArrowRight size={17} /></a></div>
            <div className="custom-examples"><div className="example-main"><Box size={100} strokeWidth={0.8} /><small>CUSTOM PANEL</small></div><div className="example-side"><div><Box size={30} /><span>Mounts</span></div><div><Box size={30} /><span>Enclosures</span></div><div><Box size={30} /><span>Brackets</span></div></div></div>
          </div>
        </section>

        <section className="about" id="about">
          <div><p className="eyebrow">WHY FABOS</p><h2>Not just a printer.<br /><em>A better way to make.</em></h2></div>
          <div className="about-copy"><p>Good 3D printing isn't about pressing a button and hoping for the best. It's about choosing the right process, material, geometry, and finish for what the part actually needs to do.</p><p>That's the difference we bring to every order — whether it's a small desk accessory or a completely custom build.</p></div>
        </section>

        <section className="faq" id="contact">
          <div className="section-heading centered"><p className="eyebrow">QUESTIONS</p><h2>Before you <em>order.</em></h2></div>
          {['How long does an order take?', 'Can you print a design I already have?', 'What materials and colors are available?'].map((question, index) => (
            <div className="faq-row" key={question}>
              <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span>{openFaq === index ? <Minus size={18} /> : <Plus size={18} />}</button>
              {openFaq === index && <p>{index === 0 ? 'Most standard projects are produced in a few business days. Custom projects can vary based on complexity.' : index === 1 ? 'Absolutely. Upload your model during the custom project process and we can review it before production.' : 'We can offer a growing range of common 3D-printing materials, finishes, and colors depending on the project.'}</p>}
            </div>
          ))}
        </section>
      </main>

      <footer><div className="brand"><span className="brand-mark"><Box size={17} /></span><span>FAB<span>OS</span></span></div><p>Useful things. Made better.</p><small>© 2026 FabOS. All rights reserved.</small></footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
