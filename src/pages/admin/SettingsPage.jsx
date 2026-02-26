import { useState } from 'react'
import { Save } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../context/ToastContext'
import { useEffect } from 'react'

const DEFAULT_SETTINGS = {
  restaurantName: 'Cheezy Heaven',
  phone1: '051-5122227',
  phone2: '0349-5479437',
  address: 'Rawalpindi, Pakistan',
  taxRate: 16,
  deliveryFee: 0,
  easypaisaNumber: '0312-8680974',
  easypaisaName: 'Afshan Majid',
  openingTime: '11:00 AM',
  closingTime: '3:00 AM',
}

export default function SettingsPage() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'restaurant'))
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }))
        }
      } catch {
        // Use defaults
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'restaurant'), settings)
      addToast('Settings saved', 'success')
    } catch {
      addToast('Failed to save settings', 'error')
    }
    setSaving(false)
  }

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Settings</h1>
        <p>Restaurant configuration</p>
      </div>

      <div style={{ maxWidth: 640 }}>
        {/* General */}
        <div className="admin-card">
          <h3>General</h3>
          <div className="admin-form-group">
            <label>Restaurant Name</label>
            <input className="admin-form-input" value={settings.restaurantName} onChange={e => update('restaurantName', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="admin-form-group">
              <label>Phone 1</label>
              <input className="admin-form-input" value={settings.phone1} onChange={e => update('phone1', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Phone 2</label>
              <input className="admin-form-input" value={settings.phone2} onChange={e => update('phone2', e.target.value)} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Address</label>
            <input className="admin-form-input" value={settings.address} onChange={e => update('address', e.target.value)} />
          </div>
        </div>

        {/* Hours */}
        <div className="admin-card">
          <h3>Business Hours</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="admin-form-group">
              <label>Opening Time</label>
              <input className="admin-form-input" value={settings.openingTime} onChange={e => update('openingTime', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Closing Time</label>
              <input className="admin-form-input" value={settings.closingTime} onChange={e => update('closingTime', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="admin-card">
          <h3>Pricing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="admin-form-group">
              <label>Tax Rate (%)</label>
              <input className="admin-form-input" type="number" value={settings.taxRate} onChange={e => update('taxRate', Number(e.target.value))} />
              <span style={{ fontSize: 12, color: 'var(--color-gray-2)', marginTop: 4, display: 'block' }}>Enter as a whole number (e.g. 16 for 16%)</span>
            </div>
            <div className="admin-form-group">
              <label>Delivery Fee (PKR)</label>
              <input className="admin-form-input" type="number" value={settings.deliveryFee} onChange={e => update('deliveryFee', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* EasyPaisa */}
        <div className="admin-card">
          <h3>EasyPaisa Payment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="admin-form-group">
              <label>Account Number</label>
              <input className="admin-form-input" value={settings.easypaisaNumber} onChange={e => update('easypaisaNumber', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Account Name</label>
              <input className="admin-form-input" value={settings.easypaisaName} onChange={e => update('easypaisaName', e.target.value)} />
            </div>
          </div>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
