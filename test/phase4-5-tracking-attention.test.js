import test from 'node:test'
import assert from 'node:assert/strict'
import {
  updateAdminFulfillment,
  transitionAdminFulfillment,
  fulfillmentTransitions,
  fulfillmentStatusLabel,
  describeFulfillment,
  getOperationsDashboard,
  getActionItems,
  splitActionItems,
  getStaffNotificationUnreadCount,
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

test('updateAdminFulfillment PATCHes the fulfillment detail with the editable fields', async () => {
  mockFetch(() => okJson({ fulfillment: { id: 'f1' } }))
  try {
    const payload = { method: 'ship', carrier: 'UPS', tracking_number: '1Z999', destination: '65230' }
    await updateAdminFulfillment('f1', payload)
    assert.equal(calls.length, 1)
    assert.match(calls[0].url, /\/api\/v1\/admin\/fulfillments\/f1$/)
    assert.equal(calls[0].method, 'PATCH')
    assert.deepEqual(JSON.parse(calls[0].body), payload)
  } finally {
    delete globalThis.fetch
  }
})

test('transitionAdminFulfillment POSTs the to_state transition', async () => {
  mockFetch(() => okJson({ fulfillment: { id: 'f1', status: 'shipped' } }))
  try {
    await transitionAdminFulfillment('f1', 'shipped')
    assert.equal(calls.length, 1)
    assert.match(calls[0].url, /\/api\/v1\/admin\/fulfillments\/f1\/transition$/)
    assert.equal(calls[0].method, 'POST')
    assert.deepEqual(JSON.parse(calls[0].body), { to_state: 'shipped' })
  } finally {
    delete globalThis.fetch
  }
})

test('fulfillmentTransitions only offers the backend-valid next states', () => {
  assert.deepEqual(fulfillmentTransitions('pending').map(t => t.to_state), ['packed', 'ready_for_pickup'])
  assert.deepEqual(fulfillmentTransitions('pending', 'shipping').map(t => t.to_state), ['packed', 'ready_for_pickup'])
  assert.deepEqual(fulfillmentTransitions('pending', 'pickup').map(t => t.to_state), ['ready_for_pickup'])
  assert.deepEqual(fulfillmentTransitions('packed').map(t => t.to_state), ['shipped', 'ready_for_pickup'])
  assert.deepEqual(fulfillmentTransitions('packed', 'pickup').map(t => t.to_state), ['ready_for_pickup'])
  assert.deepEqual(fulfillmentTransitions('shipped').map(t => t.to_state), ['delivered'])
  assert.deepEqual(fulfillmentTransitions('ready_for_pickup').map(t => t.to_state), ['picked_up'])
  assert.deepEqual(fulfillmentTransitions('delivered'), [])
  assert.deepEqual(fulfillmentTransitions('picked_up'), [])
  assert.deepEqual(fulfillmentTransitions('bogus'), [])
  assert.deepEqual(fulfillmentTransitions(''), [])
})

test('fulfillmentStatusLabel covers the known states and title-cases the rest', () => {
  assert.equal(fulfillmentStatusLabel('ready_for_pickup'), 'Ready for pickup')
  assert.equal(fulfillmentStatusLabel('picked_up'), 'Picked up')
  assert.equal(fulfillmentStatusLabel('custom_state'), 'Custom State')
  assert.equal(fulfillmentStatusLabel(''), '—')
})

test('describeFulfillment returns null when there is no fulfillment record', () => {
  assert.equal(describeFulfillment(null), null)
  assert.equal(describeFulfillment(undefined), null)
  assert.equal(describeFulfillment('nope'), null)
})

test('describeFulfillment describes a shipped package with tracking and ETA', () => {
  const summary = describeFulfillment({
    status: 'shipped', method: 'ship', carrier: 'UPS',
    tracking_number: '1Z999', tracking_url: 'https://track.example/1Z999',
    packed_at: '2026-10-06T10:00:00', shipped_at: '2026-10-07T09:00:00',
    delivered_at: null, estimated_delivery: '2026-10-10',
  })
  assert.equal(summary.kind, 'shipment')
  assert.equal(summary.heading, 'Your package is on its way')
  assert.equal(summary.carrier, 'UPS')
  assert.equal(summary.trackingNumber, '1Z999')
  assert.equal(summary.trackingUrl, 'https://track.example/1Z999')
  assert.equal(summary.estimatedDelivery, '2026-10-10')
  assert.deepEqual(summary.steps.map(s => s.label), ['Packed', 'Shipped', 'Delivered'])
  assert.equal(summary.steps[0].at, '2026-10-06T10:00:00')
  assert.equal(summary.steps[2].at, null)
})

test('describeFulfillment degrades gracefully before shipment', () => {
  const summary = describeFulfillment({ status: 'packed', method: 'ship', carrier: null, tracking_number: null, tracking_url: null })
  assert.equal(summary.kind, 'shipment')
  assert.equal(summary.heading, 'Preparing your shipment')
  assert.equal(summary.carrier, '')
  assert.equal(summary.trackingNumber, '')
  assert.equal(summary.trackingUrl, null)
})

test('describeFulfillment switches to pickup status for pickup orders', () => {
  const ready = describeFulfillment({ status: 'ready_for_pickup', method: 'pickup', picked_up_at: null })
  assert.equal(ready.kind, 'pickup')
  assert.equal(ready.heading, 'Ready for pickup')
  assert.deepEqual(ready.steps.map(s => s.label), ['Packed', 'Ready for pickup', 'Picked up'])
  const done = describeFulfillment({ status: 'picked_up', method: 'pickup', picked_up_at: '2026-10-07T15:00:00' })
  assert.equal(done.heading, 'Picked up')
  assert.equal(done.steps[2].at, '2026-10-07T15:00:00')
})

test('getOperationsDashboard requests ?all=true only when asked', async () => {
  mockFetch(() => okJson({ action_items: [] }))
  try {
    await getOperationsDashboard()
    assert.match(calls[0].url, /\/api\/v1\/admin\/operations\/dashboard$/)
    await getOperationsDashboard({ all: true })
    assert.match(calls[1].url, /\/api\/v1\/admin\/operations\/dashboard\?all=true$/)
  } finally {
    delete globalThis.fetch
  }
})

test('getActionItems returns the uncapped list via ?all=true', async () => {
  const items = [{ key: 'a', severity: 'high' }, { key: 'b', severity: 'info' }]
  mockFetch(() => okJson({ action_items: items }))
  try {
    const all = await getActionItems({ all: true })
    assert.match(calls[0].url, /all=true/)
    assert.deepEqual(all, items)
    const capped = await getActionItems()
    assert.doesNotMatch(calls[1].url, /all=true/)
    assert.deepEqual(capped, items)
  } finally {
    delete globalThis.fetch
  }
})

test('getActionItems tolerates a missing or malformed list', async () => {
  mockFetch(() => okJson({}))
  try {
    assert.deepEqual(await getActionItems({ all: true }), [])
  } finally {
    delete globalThis.fetch
  }
})

test('splitActionItems separates needs-action from informational FYI', () => {
  const items = [
    { key: 'a', severity: 'high' },
    { key: 'b', severity: 'medium' },
    { key: 'c', severity: 'info' },
    { key: 'd' },
  ]
  const { needsAction, inProgress } = splitActionItems(items)
  assert.deepEqual(needsAction.map(i => i.key), ['a', 'b', 'd'])
  assert.deepEqual(inProgress.map(i => i.key), ['c'])
  assert.deepEqual(splitActionItems(null), { needsAction: [], inProgress: [] })
})

test('getStaffNotificationUnreadCount hits the staff route and parses {unread}', async () => {
  mockFetch(() => okJson({ unread: 4 }))
  try {
    assert.equal(await getStaffNotificationUnreadCount(), 4)
    assert.match(calls[0].url, /\/api\/v1\/admin\/notifications\/unread-count$/)
  } finally {
    delete globalThis.fetch
  }
})

test('getStaffNotificationUnreadCount tolerates alternate shapes', async () => {
  for (const [payload, expected] of [[{ unread_count: 2 }, 2], [{ count: 9 }, 9], [3, 3], [{}, 0]]) {
    mockFetch(() => okJson(payload))
    try {
      assert.equal(await getStaffNotificationUnreadCount(), expected)
    } finally {
      delete globalThis.fetch
    }
  }
})
