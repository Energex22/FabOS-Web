import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)

test('all configured production entrypoints exist', () => {
  const entries = [
    'index.html',
    'custom-work.html',
    'product.html',
    'checkout.html',
    'shop.html',
    'orders.html',
    'order.html',
    'account.html',
    'quote.html',
    'admin.html',
    'about.html',
    'faq.html',
  ]
  for (const entry of entries) {
    assert.equal(existsSync(new URL(entry, root)), true, entry)
  }
})

test('production API configuration defaults to same-origin', () => {
  const api = readFileSync(new URL('src/api.js', root), 'utf8')
  assert.match(api, /VITE_API_URL/)
  assert.match(api, /['"]\/api['"]/)
})
