import assert from 'node:assert/strict'
import test from 'node:test'
import { addCartItem, cartCount, cartSubtotal, changeCartItem, readCart } from '../src/cart.js'
import { buildOrderPayload, buildQuotePayload } from '../src/customer-contracts.js'

test('cart combines matching variants and keeps separate variants separate', () => {
  const first = { id: 'dock-black', productId: 'dock', variantId: 'dock-black', name: 'Desk Cable Dock', price: 18, quantity: 1 }
  const second = { id: 'dock-black', productId: 'dock', variantId: 'dock-black', name: 'Desk Cable Dock', price: 18, quantity: 2 }
  const blue = { id: 'dock-blue', productId: 'dock', variantId: 'dock-blue', name: 'Desk Cable Dock', price: 19, quantity: 1 }

  const cart = addCartItem(addCartItem([], first), second)
  const withBlue = addCartItem(cart, blue)

  assert.equal(withBlue.length, 2)
  assert.equal(withBlue.find(item => item.id === 'dock-black').quantity, 3)
  assert.equal(cartCount(withBlue), 4)
  assert.equal(cartSubtotal(withBlue), 73)
})

test('cart quantity changes remove an item at zero', () => {
  const cart = [{ id: 'stand', name: 'Controller Stand', price: 24, quantity: 2 }]
  assert.deepEqual(changeCartItem(cart, 'stand', -1)[0].quantity, 1)
  assert.deepEqual(changeCartItem(cart, 'stand', -2), [])
})

test('invalid persisted cart data is ignored outside browser storage', () => {
  assert.deepEqual(readCart(), [])
})

test('order payload preserves product identity, variant, configuration, and shipping data', () => {
  const payload = buildOrderPayload({
    cart: [{
      id: 'dock-black',
      productId: 'dock',
      name: 'Desk Cable Dock',
      price: 18,
      quantity: 2,
      configuration: { material: 'PETG', color: 'Black' }
    }],
    form: {
      name: 'Customer',
      email: 'customer@example.com',
      address: '123 Main St',
      city: 'Lenexa',
      state: 'KS',
      zip: '66215',
      notes: 'Leave at door'
    },
    subtotal: 36,
    shipping: 6,
    total: 42
  })

  assert.equal(payload.channel, 'customer-web')
  assert.equal(payload.items[0].productId, 'dock')
  assert.equal(payload.items[0].variantId, 'dock-black')
  assert.deepEqual(payload.items[0].configuration, { material: 'PETG', color: 'Black' })
  assert.equal(payload.shippingAddress.zip, '66215')
  assert.equal(payload.totals.total, 42)
})

test('quote payload normalizes customer project data and optional file metadata', () => {
  const payload = buildQuotePayload({
    data: {
      name: ' Customer ',
      email: ' customer@example.com ',
      idea: ' Custom bracket ',
      dimensions: ' 4 x 2 x 1 ',
      material: ' PETG ',
      quantity: '3',
      notes: ' prototype '
    },
    file: { name: 'bracket.step', type: 'model/step', size: 2048 }
  })

  assert.deepEqual(payload.customer, { name: 'Customer', email: 'customer@example.com' })
  assert.equal(payload.project.quantity, 3)
  assert.equal(payload.project.idea, 'Custom bracket')
  assert.deepEqual(payload.file, { name: 'bracket.step', type: 'model/step', size: 2048 })
})
