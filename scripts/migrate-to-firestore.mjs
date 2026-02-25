/**
 * One-time migration script: uploads products.json and deals.json to Firestore.
 *
 * Usage:
 *   node scripts/migrate-to-firestore.mjs
 *
 * Reads Firebase config from .env.local in the project root.
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Parse .env.local
const envFile = readFileSync(join(root, '.env.local'), 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
})

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}\n`)

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Read JSON data
const products = JSON.parse(readFileSync(join(root, 'src', 'data', 'products.json'), 'utf8'))
const deals = JSON.parse(readFileSync(join(root, 'src', 'data', 'deals.json'), 'utf8'))

async function migrate() {
  console.log('--- Uploading Products ---')
  for (const product of products) {
    await setDoc(doc(db, 'products', String(product.id)), product)
    console.log(`  + ${product.name}`)
  }
  console.log(`Done: ${products.length} products uploaded\n`)

  console.log('--- Uploading Deals ---')
  for (const deal of deals) {
    await setDoc(doc(db, 'deals', String(deal.id)), deal)
    console.log(`  + ${deal.title}`)
  }
  console.log(`Done: ${deals.length} deals uploaded\n`)

  console.log('Migration complete! Your Firestore database is ready.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
