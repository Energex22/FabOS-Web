// Money conventions for the Fabvex storefront.
//
// The FabOS API is the single source of truth for money. Units differ by field:
// - Public catalog `price` is DOLLARS (float).
// - Variant / order / quote / invoice `*_cents` fields are integer CENTS.
// - `POST /api/v1/customer/orders` returns `totals` in DOLLARS (not cents).
//
// Callers must use the helper that matches the unit of the value they already
// have. Never divide or multiply by 100 inline at a render site.

export function centsToDollars(cents){
 return Number(cents||0)/100
}

export function formatCents(cents){
 return '$'+centsToDollars(cents).toFixed(2)
}

export function formatDollars(dollars){
 return '$'+Number(dollars||0).toFixed(2)
}
