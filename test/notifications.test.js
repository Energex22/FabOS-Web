import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  getCustomerNotifications,
  getCustomerNotificationUnreadCount,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
  updateCustomerProfile,
  customerApi,
} from '../src/api.js'

const root = new URL('../', import.meta.url)
const read = (p) => readFileSync(new URL(p, root), 'utf8')

function createStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

let calls = []
function mockFetch(resolver) {
  calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body })
    return resolver(String(url), options.method || 'GET', options.body)
  }
}
function okJson(data) {
  return { ok: true, status: 200, json: async () => data }
}
function httpError(status, detail) {
  return { ok: false, status, json: async () => ({ detail }) }
}

test('notification API functions are exported from src/api.js', () => {
  for (const name of ['getCustomerNotifications', 'getCustomerNotificationUnreadCount', 'markCustomerNotificationRead', 'markAllCustomerNotificationsRead', 'updateCustomerProfile']) {
    assert.match(read('src/api.js'), new RegExp(`export async function ${name}\\(`), `missing ${name}`)
  }
})

test('customerApi exposes notifications namespace and updateProfile', () => {
  assert.equal(typeof customerApi.notifications.list, 'function')
  assert.equal(typeof customerApi.notifications.unreadCount, 'function')
  assert.equal(typeof customerApi.notifications.markRead, 'function')
  assert.equal(typeof customerApi.notifications.markAllRead, 'function')
  assert.equal(typeof customerApi.updateProfile, 'function')
})

test('notifications.list normalizes object and bare-array shapes', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => okJson({ notifications: [{ id: 'n1', title: 'Proof ready' }] }))
  let list = await getCustomerNotifications({ limit: 20 })
  assert.deepEqual(list, [{ id: 'n1', title: 'Proof ready' }])
  assert.match(calls[0].url, /\/api\/v1\/customer\/notifications\?per_page=20/)

  mockFetch(() => okJson([{ id: 'n2' }]))
  list = await getCustomerNotifications()
  assert.deepEqual(list, [{ id: 'n2' }])
})

test('notifications.list uses the backend pagination contract (page/per_page)', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => okJson({ notifications: [] }))
  // `limit` is translated to per_page — the backend never honored `limit`,
  // so the center previously showed only the default 25 rows.
  await getCustomerNotifications({ limit: 100 })
  assert.match(calls[0].url, /\/api\/v1\/customer\/notifications\?per_page=100/)
  assert.doesNotMatch(calls[0].url, /limit=/)
  assert.doesNotMatch(calls[0].url, /offset=/)
  assert.doesNotMatch(calls[0].url, /unread_only=/)

  mockFetch(() => okJson({ notifications: [] }))
  await getCustomerNotifications({ per_page: 10, page: 3 })
  assert.match(calls[0].url, /per_page=10/)
  assert.match(calls[0].url, /page=3/)

  // per_page is clamped to the server maximum of 100.
  mockFetch(() => okJson({ notifications: [] }))
  await getCustomerNotifications({ limit: 500 })
  assert.match(calls[0].url, /per_page=100/)
})

test('notifications.unreadCount normalizes object and bare-number shapes', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => okJson({ unread_count: 3 }))
  assert.equal(await getCustomerNotificationUnreadCount(), 3)
  assert.match(calls[0].url, /\/api\/v1\/customer\/notifications\/unread-count/)

  mockFetch(() => okJson({ unread: 5 }))
  assert.equal(await getCustomerNotificationUnreadCount(), 5)

  mockFetch(() => okJson(7))
  assert.equal(await getCustomerNotificationUnreadCount(), 7)
})

test('markRead posts to the per-notification endpoint', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => okJson({ ok: true }))
  await markCustomerNotificationRead('abc-123')
  assert.match(calls[0].url, /\/api\/v1\/customer\/notifications\/abc-123\/read/)
  assert.equal(calls[0].method, 'POST')
})

test('markAllRead posts to the read-all endpoint', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => okJson({ ok: true }))
  await markAllCustomerNotificationsRead()
  assert.match(calls[0].url, /\/api\/v1\/customer\/notifications\/read-all/)
  assert.equal(calls[0].method, 'POST')
})

test('updateProfile PATCHes the customer profile', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => okJson({ customer: { notification_preference: 'email' } }))
  const result = await customerApi.updateProfile({ notification_preference: 'email' })
  assert.match(calls[0].url, /\/api\/v1\/customer\/me/)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(JSON.parse(calls[0].body).notification_preference, 'email')
  assert.equal(result.customer.notification_preference, 'email')
})

test('notification API failures carry error.status for 401 handling', async () => {
  globalThis.localStorage = createStorage()
  mockFetch(() => httpError(401, 'expired'))
  const err = await getCustomerNotifications().catch((e) => e)
  assert.equal(err.status, 401)
})

test('bell component polls count and hides when logged out', () => {
  const ui = read('src/notifications-ui.jsx')
  assert.match(ui, /NotificationBell/)
  assert.match(ui, /60000/)
  assert.match(ui, /visibilitychange/)
  assert.match(ui, /unreadCount/)
  assert.match(ui, /notif-badge/)
  assert.match(ui, /\/notifications\.html/)
  assert.match(ui, /if\(!token\)return null/)
})

test('deep-link helper routes proof events to the proof anchor', () => {
  const ui = read('src/notifications-ui.jsx')
  assert.match(ui, /quote\.html\?id=.*#proof/)
  assert.match(ui, /quote\.html\?id=/)
  assert.match(ui, /order\.html\?id=/)
})

test('bell is mounted in the customer page headers', () => {
  for (const file of ['home.jsx', 'about.jsx', 'faq.jsx', 'shop.jsx', 'product.jsx', 'checkout.jsx', 'custom-work.jsx', 'orders.jsx', 'order.jsx', 'quote.jsx', 'account.jsx']) {
    const src = read('src/' + file)
    assert.match(src, /NotificationBell/, `${file} is missing the notification bell`)
  }
})

test('notifications page covers list, empty, error, and mark-all-read states', () => {
  const src = read('src/notifications.jsx')
  assert.match(src, /notifications\.list/)
  assert.match(src, /notifications\.markRead/)
  assert.match(src, /notifications\.markAllRead/)
  assert.match(src, /You're all caught up/)
  assert.match(src, /Mark all read/)
  assert.match(src, /Sign in to see your notifications/)
  assert.match(src, /deepLinkFor/)
})

test('account page has honest notification preferences with SMS marked coming soon', () => {
  const src = read('src/account.jsx')
  assert.match(src, /NOTIFICATIONS/)
  assert.match(src, /COMING SOON/)
  assert.match(src, /notif-channel/)
  assert.match(src, /updateProfile/)
  assert.match(src, /notification_preference/)
  // SMS options are disabled controls with an honest note, not dead buttons
  assert.match(src, /SMS<span className="notif-soon">/)
  assert.match(src, /aren't available yet/)
})

test('notifications.html entry is registered in the vite build inputs', () => {
  assert.match(read('vite.config.js'), /notifications:'notifications\.html'/)
  assert.ok(readFileSync(new URL('notifications.html', root), 'utf8').includes('notifications-root'))
})

test('quote page still scrolls to the proof panel on the #proof anchor', () => {
  const src = read('src/quote.jsx')
  assert.match(src, /id="proof"/)
  assert.match(src, /#proof/)
  assert.match(src, /scrollIntoView/)
})
