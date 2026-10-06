import assert from 'node:assert/strict'
import test from 'node:test'
import { addCartItem, cartCount, cartSubtotal, changeCartItem, readCart } from '../src/cart.js'

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

test('cart caps unsafe persisted quantities', () => {
  const cart = addCartItem([], { id: 'large', name: 'Large quantity', price: 1, quantity: 5000 })
  assert.equal(cart[0].quantity, 1000)
})
