// Input validation & sanitization — OWASP best practices.
// All user inputs are validated before reaching Firestore.
// Firestore rules are the server-side backup; this is defense-in-depth.

// --- Sanitization helpers ---

/** Strip HTML tags and trim whitespace. Prevents stored XSS. */
export function sanitizeText(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

/** Enforce max length after sanitization. */
export function sanitizeAndLimit(str, maxLength) {
  return sanitizeText(str).slice(0, maxLength)
}

/** Sanitize promo code: uppercase, alphanumeric only, max 20 chars. */
export function sanitizePromoCode(code) {
  if (typeof code !== 'string') return ''
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20)
}

// --- Validation constants ---

const LIMITS = {
  name: { min: 1, max: 100 },
  email: { max: 254 },           // RFC 5321
  phone: { min: 10, max: 20 },
  password: { min: 6, max: 128 },
  address: { min: 5, max: 500 },
  addressLabel: { min: 1, max: 50 },
  promoCode: { min: 1, max: 20 },
  searchQuery: { max: 200 },
  reviewComment: { max: 1000 },
  itemsPerOrder: { max: 50 },
}

export { LIMITS }

// --- Phone validation ---

const PK_PHONE_REGEX = /^(0\d{10}|\+92\d{10})$/

export function validatePhone(phone) {
  const cleaned = sanitizeText(phone).replace(/[\s\-()]/g, '')
  if (cleaned.length < LIMITS.phone.min || cleaned.length > LIMITS.phone.max) {
    return { valid: false, error: 'Phone number must be 10-20 digits', cleaned }
  }
  if (!PK_PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Enter a valid Pakistani number (e.g., 03001234567)', cleaned }
  }
  return { valid: true, error: null, cleaned }
}

// --- Email validation ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  const cleaned = sanitizeText(email).toLowerCase()
  if (!cleaned || cleaned.length > LIMITS.email.max) {
    return { valid: false, error: 'Invalid email address' }
  }
  if (!EMAIL_REGEX.test(cleaned)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true, error: null }
}

// --- Name validation ---

export function validateName(name) {
  const cleaned = sanitizeAndLimit(name, LIMITS.name.max)
  if (cleaned.length < LIMITS.name.min) {
    return { valid: false, error: 'Name is required' }
  }
  return { valid: true, error: null, cleaned }
}

// --- Address validation ---

export function validateAddress(address) {
  const cleaned = sanitizeAndLimit(address, LIMITS.address.max)
  if (cleaned.length < LIMITS.address.min) {
    return { valid: false, error: 'Address must be at least 5 characters' }
  }
  return { valid: true, error: null, cleaned }
}

// --- Order data validation (schema-based) ---

export function validateOrderData(data) {
  const errors = []

  // Items array
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item')
  } else if (data.items.length > LIMITS.itemsPerOrder.max) {
    errors.push(`Order cannot exceed ${LIMITS.itemsPerOrder.max} items`)
  } else {
    data.items.forEach((item, i) => {
      if (typeof item.name !== 'string' || !item.name.trim()) {
        errors.push(`Item ${i + 1}: name is required`)
      }
      if (typeof item.qty !== 'number' || item.qty < 1 || !Number.isInteger(item.qty)) {
        errors.push(`Item ${i + 1}: invalid quantity`)
      }
      if (typeof item.price !== 'number' || item.price < 0 || !Number.isFinite(item.price)) {
        errors.push(`Item ${i + 1}: invalid price`)
      }
    })
  }

  // Numeric fields
  const numericFields = ['subtotal', 'tax', 'deliveryFee', 'total']
  numericFields.forEach(field => {
    if (typeof data[field] !== 'number' || !Number.isFinite(data[field])) {
      errors.push(`${field} must be a valid number`)
    }
  })

  if (typeof data.subtotal === 'number' && data.subtotal < 0) {
    errors.push('Subtotal cannot be negative')
  }
  if (typeof data.total === 'number' && data.total < 0) {
    errors.push('Total cannot be negative')
  }

  // promoDiscount
  if (data.promoDiscount !== undefined) {
    if (typeof data.promoDiscount !== 'number' || !Number.isFinite(data.promoDiscount) || data.promoDiscount < 0) {
      errors.push('Promo discount must be a non-negative number')
    }
    if (typeof data.promoDiscount === 'number' && typeof data.subtotal === 'number' && data.promoDiscount > data.subtotal) {
      errors.push('Promo discount cannot exceed subtotal')
    }
  }

  // Address & phone
  const addrResult = validateAddress(data.address || '')
  if (!addrResult.valid) errors.push(addrResult.error)

  const phoneResult = validatePhone(data.phone || '')
  if (!phoneResult.valid) errors.push(phoneResult.error)

  // Status must be 'confirmed' for new orders
  if (data.status && data.status !== 'confirmed') {
    errors.push('Invalid order status')
  }

  return { valid: errors.length === 0, errors }
}

// --- Sanitize order data before sending to Firestore ---

export function sanitizeOrderData(data) {
  return {
    ...data,
    address: sanitizeAndLimit(data.address || '', LIMITS.address.max),
    phone: sanitizeText(data.phone || '').replace(/[^\d+\-() ]/g, '').slice(0, LIMITS.phone.max),
    userName: sanitizeAndLimit(data.userName || '', LIMITS.name.max),
    payment: sanitizeAndLimit(data.payment || '', 50),
    items: (data.items || []).slice(0, LIMITS.itemsPerOrder.max).map(item => ({
      name: sanitizeAndLimit(item.name || '', 200),
      qty: Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 1))),
      size: sanitizeAndLimit(item.size || '', 50),
      customizations: Array.isArray(item.customizations)
        ? item.customizations.slice(0, 20).map(c => sanitizeAndLimit(String(c), 100))
        : [],
      price: Math.max(0, Number(item.price) || 0),
    })),
  }
}
