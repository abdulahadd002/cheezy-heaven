// Client-side rate limiter using sliding window.
// Prevents accidental abuse (rapid clicks, bot spam).
// Not a substitute for server-side limits — Firestore rules are the real guard.

const windows = new Map()

/**
 * Check if an action is allowed under its rate limit.
 * @param {string} key   — Unique action identifier (e.g. 'order-create', 'promo-check')
 * @param {number} limit — Max allowed calls within the window
 * @param {number} windowMs — Time window in milliseconds
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now()

  if (!windows.has(key)) {
    windows.set(key, [])
  }

  const timestamps = windows.get(key)

  // Remove expired entries outside the window
  while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
    timestamps.shift()
  }

  if (timestamps.length >= limit) {
    const oldestInWindow = timestamps[0]
    const retryAfterMs = oldestInWindow + windowMs - now
    return { allowed: false, retryAfterMs }
  }

  timestamps.push(now)
  return { allowed: true, retryAfterMs: 0 }
}

/**
 * Reset rate limit for a specific key (e.g. after successful action).
 */
export function resetRateLimit(key) {
  windows.delete(key)
}

// --- Pre-configured rate limiters for each action ---

// Order creation: max 3 orders per 5 minutes
export function canPlaceOrder() {
  return checkRateLimit('order-create', 3, 5 * 60 * 1000)
}

// Promo code validation: max 5 attempts per 2 minutes
export function canCheckPromo() {
  return checkRateLimit('promo-check', 5, 2 * 60 * 1000)
}

// Auth attempts (login/signup): max 5 per 3 minutes
export function canAttemptAuth() {
  return checkRateLimit('auth-attempt', 5, 3 * 60 * 1000)
}

// Profile updates: max 10 per 5 minutes
export function canUpdateProfile() {
  return checkRateLimit('profile-update', 10, 5 * 60 * 1000)
}

// Favorites toggle: max 30 per minute (generous for browsing)
export function canToggleFavorite() {
  return checkRateLimit('favorite-toggle', 30, 60 * 1000)
}
