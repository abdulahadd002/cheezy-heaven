import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, arrayUnion,
  query, where, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import { sanitizeText, sanitizeAndLimit, sanitizePromoCode, LIMITS } from './validate'

// --- Products ---

export async function getProducts() {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getProduct(productId) {
  const snap = await getDoc(doc(db, 'products', String(productId)))
  return snap.exists() ? { ...snap.data(), id: snap.id } : null
}

// --- Deals ---

export async function getDeals() {
  const snap = await getDocs(collection(db, 'deals'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

// --- Orders ---

export async function createOrder(orderId, orderData) {
  // Defense-in-depth: sanitize string fields even though caller should too
  const safeData = {
    ...orderData,
    address: sanitizeAndLimit(orderData.address || '', LIMITS.address.max),
    phone: sanitizeText(orderData.phone || '').slice(0, LIMITS.phone.max),
    userName: sanitizeAndLimit(orderData.userName || '', LIMITS.name.max),
    status: 'confirmed',
    statusHistory: [{ status: 'confirmed', time: new Date().toISOString() }],
    placedAt: new Date().toISOString(),
  }
  await setDoc(doc(db, 'orders', orderId), safeData)
  return orderId
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId))
  return snap.exists() ? { ...snap.data(), id: snap.id } : null
}

export function subscribeToOrder(orderId, callback) {
  return onSnapshot(
    doc(db, 'orders', orderId),
    (snap) => { callback(snap.exists() ? { ...snap.data(), id: snap.id } : null) },
    (error) => { console.error('subscribeToOrder error:', error) }
  )
}

export async function updateOrderStatus(orderId, newStatus) {
  await updateDoc(doc(db, 'orders', orderId), {
    status: newStatus,
    statusHistory: arrayUnion({ status: newStatus, time: new Date().toISOString() }),
  })
}

export async function getUserOrders(userId) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const orders = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  // Sort client-side to avoid needing a composite index
  orders.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''))
  return orders
}

// --- Admin: Real-time all orders ---

export function subscribeToAllOrders(callback) {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const orders = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      orders.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''))
      callback(orders)
    },
    (error) => { console.error('subscribeToAllOrders error:', error) }
  )
}

export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, 'orders', String(orderId)))
}

// --- Admin: Product management ---

export async function updateProduct(productId, updates) {
  await updateDoc(doc(db, 'products', String(productId)), updates)
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', String(productId)))
}

export async function createProduct(productId, data) {
  await setDoc(doc(db, 'products', String(productId)), data)
}

// --- Admin: Deal management ---

export async function updateDeal(dealId, updates) {
  await updateDoc(doc(db, 'deals', String(dealId)), updates)
}

export async function deleteDeal(dealId) {
  await deleteDoc(doc(db, 'deals', String(dealId)))
}

export async function createDeal(dealId, data) {
  await setDoc(doc(db, 'deals', String(dealId)), data)
}

// --- Promo Codes ---

export async function getPromoCode(code) {
  // Sanitize: alphanumeric only, uppercase, max 20 chars
  const safeCode = sanitizePromoCode(code)
  if (!safeCode) return null
  const snap = await getDoc(doc(db, 'promoCodes', safeCode))
  if (!snap.exists()) return null
  const promo = { ...snap.data(), id: snap.id }
  return promo.active ? promo : null
}

export function subscribeToPromoCodes(callback) {
  return onSnapshot(
    collection(db, 'promoCodes'),
    (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    },
    (error) => console.error('subscribeToPromoCodes error:', error)
  )
}

export async function createPromoCode(data) {
  // Use the code itself as the document ID so customers can look up by code
  const code = data.code.toUpperCase()
  await setDoc(doc(db, 'promoCodes', code), {
    ...data,
    code,
    createdAt: new Date().toISOString(),
  })
}

export async function deletePromoCode(promoId) {
  await deleteDoc(doc(db, 'promoCodes', promoId))
}

// --- Reviews ---

export async function addOrderReview(orderId, review) {
  // Sanitize review text to prevent stored XSS
  const safeReview = {
    rating: Math.max(1, Math.min(5, Math.floor(Number(review.rating) || 1))),
    comment: sanitizeAndLimit(review.comment || '', LIMITS.reviewComment.max),
    createdAt: new Date().toISOString(),
  }
  await updateDoc(doc(db, 'orders', orderId), { review: safeReview })
}
