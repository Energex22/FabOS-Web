import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const root = new URL('../', import.meta.url)

function customerApiBlock() {
  const api = readFileSync(new URL('src/api.js', root), 'utf8')
  const match = api.match(/export const customerApi=\{([\s\S]*?)\n\}/)
  assert.ok(match, 'customerApi export not found in src/api.js')
  return match[1]
}

function definedMethods(block) {
  const defined = new Set()
  for (const m of block.matchAll(/(?:^|[{,])\s*([A-Za-z_]\w*)\s*(?::|,)/gm)) defined.add(m[1])
  return defined
}

function referencedMethods() {
  const refs = new Set()
  for (const file of readdirSync(new URL('src', root))) {
    if (!file.endsWith('.jsx')) continue
    const src = readFileSync(new URL('src/' + file, root), 'utf8')
    for (const m of src.matchAll(/customerApi\.([A-Za-z_]\w*)/g)) refs.add(m[1])
  }
  return refs
}

test('every customerApi method referenced by the JSX sources exists in src/api.js', () => {
  const defined = definedMethods(customerApiBlock())
  const refs = referencedMethods()
  assert.ok(refs.size > 0, 'no customerApi references found in JSX sources')
  for (const name of [...refs].sort()) {
    assert.ok(defined.has(name), `customerApi.${name} is referenced by JSX but not defined in src/api.js`)
  }
})

test('quote/proof workflow adapters are defined on customerApi', () => {
  const defined = definedMethods(customerApiBlock())
  for (const name of ['getProofs', 'acceptQuote', 'declineQuote', 'proofAction', 'proofFile']) {
    assert.ok(defined.has(name), `customerApi.${name} is missing from src/api.js`)
  }
})
