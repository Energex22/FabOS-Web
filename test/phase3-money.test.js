import test from 'node:test'
import assert from 'node:assert/strict'
import {
  customerApi,
  parseTotals,
  extractNextStep,
  nextStepLabel,
  orderPaymentGate,
  getAdminOrder,
  createAdminInvoiceFromOrder,
  recordAdminInvoicePayment,
} from '../src/api.js'

let calls = []
function mockFetch(resolver) {
  calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body })
    return resolver(String(url), options.method || 'GET', options.body)
  }
}
const okJson = (payload) => ({ ok: true, status: 200, json: async () => payload })

test('orderTotalsPreview posts the order payload to the preview endpoint', async () => {
  mockFetch(() => okJson({ totals: { subtotal_cents: 1000, tax_cents: 80, shipping_cents: 500, total_cents: 1580 } }))
  try {
    const payload = { items: [{ productId: 'p1', quantity: 1 }], shippingAddress: { zip: '65230' } }
    const data = await customerApi.orderTotalsPreview(payload)
    assert.equal(calls.length, 1)
    assert.match(calls[0].url, /\/api\/v1\/customer\/orders\/preview$/)
    assert.equal(calls[0].method, 'POST')
    assert.deepEqual(JSON.parse(calls[0].body), payload)
    assert.deepEqual(parseTotals(data), { itemsCents: 1000, taxCents: 80, shippingCents: 500, totalCents: 1580 })
  } finally {
    delete globalThis.fetch
  }
})

test('parseTotals accepts the dollars convention used by the createOrder response', () => {
  assert.deepEqual(parseTotals({ totals: { subtotal: 10.0, tax: 0.8, shipping: 5.0, total: 15.8 } }),
    { itemsCents: 1000, taxCents: 80, shippingCents: 500, totalCents: 1580 })
})

test('parseTotals returns null for missing or unreadable totals', () => {
  assert.equal(parseTotals(null), null)
  assert.equal(parseTotals({}), null)
  assert.equal(parseTotals({ totals: { tax_cents: 5 } }), null)
})

test('getAdminOrder fetches the admin order detail', async () => {
  mockFetch(() => okJson({ order: { id: 'o1' }, next_step: 'awaiting_payment' }))
  try {
    const data = await getAdminOrder('o1')
    assert.match(calls[0].url, /\/api\/v1\/admin\/orders\/o1$/)
    assert.equal(calls[0].method, 'GET')
    assert.equal(extractNextStep(data), 'awaiting_payment')
  } finally {
    delete globalThis.fetch
  }
})

test('extractNextStep handles the backend dict shape {step,label,detail}', () => {
  assert.equal(extractNextStep({ next_step: { step: 'awaiting_payment', label: 'Awaiting payment', detail: 'x' } }), 'awaiting_payment')
  assert.equal(extractNextStep({ order: { next_step: { step: 'ready_for_production' } } }), 'ready_for_production')
  assert.equal(extractNextStep({ next_step: 'in_production' }), 'in_production')
  assert.equal(extractNextStep({}), '')
})

test('createAdminInvoiceFromOrder posts to the order invoice endpoint', async () => {
  mockFetch(() => okJson({ invoice: { id: 'i1', invoice_number: 'INV-1' } }))
  try {
    const invoice = await createAdminInvoiceFromOrder('o1')
    assert.match(calls[0].url, /\/api\/v1\/admin\/orders\/o1\/invoice$/)
    assert.equal(calls[0].method, 'POST')
    assert.equal(invoice.invoice_number, 'INV-1')
  } finally {
    delete globalThis.fetch
  }
})

test('recordAdminInvoicePayment posts amount, method and reference', async () => {
  mockFetch(() => okJson({ invoice_id: 'i1', recorded_cents: 1500 }))
  try {
    const result = await recordAdminInvoicePayment('i1', { amount_cents: 1500, method: 'card', reference: 'ch_1' })
    assert.match(calls[0].url, /\/api\/v1\/admin\/invoices\/i1\/payments$/)
    assert.equal(calls[0].method, 'POST')
    assert.deepEqual(JSON.parse(calls[0].body), { amount_cents: 1500, method: 'card', reference: 'ch_1' })
    assert.equal(result.recorded_cents, 1500)
  } finally {
    delete globalThis.fetch
  }
})

test('nextStepLabel maps known states and title-cases the rest', () => {
  assert.equal(nextStepLabel('awaiting_payment'), 'Awaiting payment')
  assert.equal(nextStepLabel('ready_for_production'), 'Ready for production')
  assert.equal(nextStepLabel('some_future_state'), 'Some Future State')
  assert.equal(nextStepLabel(''), '—')
})

test('orderPaymentGate disables production start while awaiting payment', () => {
  assert.equal(orderPaymentGate({ next_step: 'awaiting_payment' }), 'awaiting_payment')
  assert.equal(orderPaymentGate({ order: { status: 'pending' } }), 'awaiting_payment')
  assert.equal(orderPaymentGate({ status: 'new' }), 'awaiting_payment')
})

test('orderPaymentGate marks terminal orders and known-ready orders', () => {
  assert.equal(orderPaymentGate({ order: { status: 'cancelled' } }), 'terminal')
  assert.equal(orderPaymentGate({ order: { status: 'completed' } }), 'terminal')
  assert.equal(orderPaymentGate({ next_step: 'ready_for_production' }), 'ready')
})

test('orderPaymentGate stays unknown without a payment signal (backend remains the safety net)', () => {
  assert.equal(orderPaymentGate({ order: { status: 'confirmed' } }), 'unknown')
  assert.equal(orderPaymentGate({}), 'unknown')
})
