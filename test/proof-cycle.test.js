import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const read = (p) => readFileSync(new URL(p, root), 'utf8')

test('admin proof service functions are defined in src/api.js', () => {
  const api = read('src/api.js')
  for (const name of ['getAdminProofs', 'getAdminProof', 'getAdminQuoteProofs', 'createAdminProof', 'uploadAdminProof', 'sendAdminProof']) {
    assert.match(api, new RegExp(`export async function ${name}\\(`), `api.js is missing ${name}`)
  }
})

test('admin proof endpoints use the documented shapes', () => {
  const api = read('src/api.js')
  assert.match(api, /\/api\/v1\/admin\/proofs/)
  assert.match(api, /\/api\/v1\/admin\/quotes\/.*\/proofs/)
  assert.match(api, /proofs\/upload/)
  assert.match(api, /proofs\/.*\/send/)
  assert.match(api, /status/)
})

test('draft_proof_message seam exists and is explicitly unimplemented', () => {
  const api = read('src/api.js')
  assert.match(api, /export async function draft_proof_message/)
  assert.match(api, /AI-draft seam/)
  assert.match(api, /return null/)
})

test('quote proof panel: request-changes is a visible choice with a required field', () => {
  const quote = read('src/quote.jsx')
  assert.match(quote, /What should we change\?/)
  assert.match(quote, /Required/)
  assert.match(quote, /Request changes/)
  assert.match(quote, /Approve proof/)
  assert.doesNotMatch(quote, /Optional approval note/)
})

test('quote proof panel renders inline and tracks versions', () => {
  const quote = read('src/quote.jsx')
  assert.match(quote, /CadPreview/)
  assert.match(quote, /proof-versions|Version \{/)
  assert.match(quote, /id="proof"/)
  assert.match(quote, /#proof/)
})

test('quote proof panel shows the static response-time copy', () => {
  const quote = read('src/quote.jsx')
  assert.match(quote, /typically respond within 2 business days/)
})

test('quote expiry is displayed with warning and recovery states', () => {
  const quote = read('src/quote.jsx')
  assert.match(quote, /Quote valid until/)
  assert.match(quote, /expires_at/)
  assert.match(quote, /Request an updated quote/)
  assert.match(quote, /This quote has expired/)
})

test('order page shows a blocking proof card deep-linking to the quote', () => {
  const order = read('src/order.jsx')
  assert.match(order, /Approve your design proof/)
  assert.match(order, /quote\.html\?id=/)
  assert.match(order, /#proof/)
  assert.match(order, /View linked quote/)
})

test('Proofs workspace groups the queue by status with quote deep-links', () => {
  const ws = read('src/admin-workspaces.jsx')
  assert.match(ws, /function Proofs\(/)
  assert.match(ws, /AWAITING REVIEW/)
  assert.match(ws, /CHANGES REQUESTED/)
  assert.match(ws, /APPROVED/)
  assert.match(ws, /onOpenQuote/)
})

test('quote detail proof flow uploads versions, notes, and sends with the AI seam', () => {
  const ws = read('src/admin-workspaces.jsx')
  assert.match(ws, /function QuoteProofs\(/)
  assert.match(ws, /uploadAdminProof/)
  assert.match(ws, /sendAdminProof/)
  assert.match(ws, /draft_proof_message/)
  assert.match(ws, /AI drafting coming/)
  assert.match(ws, /Per-revision staff note/)
  assert.match(ws, /customer_comment/)
  assert.match(ws, /Change request:/)
})

test('quote_validity_days is a proper numeric setting in the settings UI', () => {
  const ws = read('src/admin-workspaces.jsx')
  assert.match(ws, /quote_validity_days/)
  assert.match(ws, /type="number"/)
  assert.match(ws, /Quote validity period/)
})

test('admin console: Proofs nav and changes_requested Action Center item', () => {
  const admin = read('src/admin.jsx')
  assert.match(admin, />Proofs</)
  assert.match(admin, /getAdminProofs/)
  assert.match(admin, /changes_requested/)
  assert.match(admin, /Proof changes requested/)
  assert.match(admin, /className="action high"/)
})

test('customer proof panel reads the customer-facing customer_note, not internal notes', () => {
  const quote = read('src/quote.jsx')
  assert.match(quote, /previewProof\.customer_note/)
  assert.doesNotMatch(quote, /previewProof\.notes/)
})

test('admin proof send/upload/create post the note as customer_note', () => {
  const api = read('src/api.js')
  assert.match(api, /customer_note:customerNote\|\|''/)
  assert.match(api, /formData\.append\('customer_note'/)
  assert.match(api, /customer_note,send/)
  const ws = read('src/admin-workspaces.jsx')
  assert.match(ws, /createAdminProof\(quoteId,\{customer_note:note,send:sendNow\}\)/)
  assert.match(ws, /sendNote\[p\.id\]\?\?p\.customer_note\?\?''/)
})
