import test from 'node:test'
import assert from 'node:assert/strict'
import {shipmentLine, shortDateLabel, settingMetaDescription} from '../src/api.js'

test('shipmentLine returns null when there is no fulfillment record', () => {
  assert.equal(shipmentLine(null), null)
  assert.equal(shipmentLine(undefined), null)
  assert.equal(shipmentLine('nope'), null)
  assert.equal(shipmentLine({}), null)
  // The backend attaches an all-null placeholder object for orders without a
  // fulfillment record — that must hide the shipment row, not show "Preparing".
  assert.equal(shipmentLine({carrier: null, tracking_number: null, tracking_url: null, method: null, status: null, packed_at: null, shipped_at: null, delivered_at: null, picked_up_at: null, estimated_delivery: null}), null)
})

test('shipmentLine describes a shipped package with carrier, tracking and ETA', () => {
  const line = shipmentLine({
    carrier: 'UPS', tracking_number: '1Z999999', tracking_url: 'https://example.com/track/1Z999999',
    method: 'ship', status: 'shipped', estimated_delivery: '2026-10-12',
    packed_at: null, shipped_at: '2026-10-07', delivered_at: null, picked_up_at: null,
  })
  assert.equal(line.kind, 'shipment')
  assert.equal(line.label, 'Shipped')
  assert.equal(line.carrier, 'UPS')
  assert.equal(line.trackingNumber, '1Z999999')
  assert.equal(line.trackingUrl, 'https://example.com/track/1Z999999')
  assert.match(line.etaLabel, /^Oct \d{1,2}$/)
})

test('shipmentLine degrades gracefully before shipment', () => {
  const line = shipmentLine({status: 'packed', method: 'ship', carrier: null, tracking_number: null, tracking_url: null, estimated_delivery: null})
  assert.equal(line.label, 'Preparing your shipment')
  assert.equal(line.carrier, '')
  assert.equal(line.trackingNumber, '')
  assert.equal(line.trackingUrl, null)
  assert.equal(line.etaLabel, '')
})

test('shipmentLine marks delivered orders', () => {
  const line = shipmentLine({status: 'delivered', method: 'ship', carrier: 'FedEx', tracking_number: '123', tracking_url: null, estimated_delivery: null})
  assert.equal(line.label, 'Delivered')
  assert.equal(line.carrier, 'FedEx')
  assert.equal(line.trackingNumber, '123')
  assert.equal(line.trackingUrl, null)
})

test('shipmentLine switches to pickup status for pickup orders', () => {
  const ready = shipmentLine({status: 'ready_for_pickup', method: 'pickup'})
  assert.equal(ready.kind, 'pickup')
  assert.equal(ready.label, 'Ready for pickup')
  const picked = shipmentLine({status: 'picked_up', method: 'pickup'})
  assert.equal(picked.label, 'Picked up')
  const prepping = shipmentLine({status: 'packed', method: 'pickup'})
  assert.equal(prepping.label, 'Preparing your pickup')
})

test('shortDateLabel formats ISO dates compactly and rejects garbage', () => {
  assert.equal(shortDateLabel('2026-10-12'), 'Oct 12')
  assert.match(shortDateLabel('2026-10-12T14:30:00'), /^Oct \d{1,2}$/)
  assert.equal(shortDateLabel(''), '')
  assert.equal(shortDateLabel(null), '')
  assert.equal(shortDateLabel('not-a-date'), '')
})

test('settingMetaDescription reads object and string metadata entries', () => {
  const data = {
    metadata: {
      shop: {public_base_url: {description: 'Public shop address.'}, quote_validity_days: 'Days quotes stay valid.'},
      integrations: {resend_api_key: {label: 'Resend key'}},
    },
  }
  assert.equal(settingMetaDescription(data, 'public_base_url'), 'Public shop address.')
  assert.equal(settingMetaDescription(data, 'quote_validity_days'), 'Days quotes stay valid.')
  assert.equal(settingMetaDescription(data, 'resend_api_key'), 'Resend key')
  assert.equal(settingMetaDescription(data, 'missing_key'), '')
  assert.equal(settingMetaDescription(null, 'public_base_url'), '')
})
