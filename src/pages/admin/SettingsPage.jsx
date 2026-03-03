import { useState, useEffect } from 'react'
import { Save, Trash2, Plus } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../context/ToastContext'
import { subscribeToPromoCodes, createPromoCode, deletePromoCode } from '../../lib/firestore'

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
  const [promoCodes, setPromoCodes] = useState([])
  const [newPromo, setNewPromo] = useState({ code: '', discount: '', minOrder: '', active: true })
  const [addingPromo, setAddingPromo] = useState(false)
  const [savingPromo, setSavingPromo] = useState(false)
  const [deletingPromoId, setDeletingPromoId] = useState(null)

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

  useEffect(() => {
    const unsub = subscribeToPromoCodes(setPromoCodes)
    return () => unsub()
  }, [])

  const handleAddPromo = async () => {
    if (!newPromo.code.trim()) { addToast('Code is required', 'error'); return }
    const disc = Number(newPromo.discount)
    if (isNaN(disc) || disc <= 0 || disc > 100) { addToast('Discount must be 1-100%', 'error'); return }
    setSavingPromo(true)
    try {
      await createPromoCode({
        code: newPromo.code.trim(),
        discount: disc,
        minOrder: Number(newPromo.minOrder) || 0,
        active: newPromo.active,
      })
      addToast('Promo code created', 'success')
      setNewPromo({ code: '', discount: '', minOrder: '', active: true })
      setAddingPromo(false)
    } catch {
      addToast('Failed to create promo code', 'error')
    }
    setSavingPromo(false)
  }

  const handleDeletePromo = async (promo) => {
    if (!window.confirm(`Delete promo "${promo.code}"?`)) return
    setDeletingPromoId(promo.id)
    try {
      await deletePromoCode(promo.id)
      addToast('Promo code deleted', 'success')
    } catch {
      addToast('Failed to delete promo code', 'error')
    }
    setDeletingPromoId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'restaurant'), settings, { merge: true })
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

        {/* Promo Codes */}
        <div className="admin-card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ marginBottom: 0 }}>Promo Codes</h3>
            {!addingPromo && (
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAddingPromo(true)}>
                <Plus size={14} /> Add Code
              </button>
            )}
          </div>

          {addingPromo && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
              <div className="admin-form-group" style={{ marginBottom: 0, flex: '1 1 120px' }}>
                <label>Code</label>
                <input className="admin-form-input" value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME10" />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0, width: 100 }}>
                <label>Discount %</label>
                <input className="admin-form-input" type="number" value={newPromo.discount} onChange={e => setNewPromo(p => ({ ...p, discount: e.target.value }))} placeholder="10" />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0, width: 120 }}>
                <label>Min Order</label>
                <input className="admin-form-input" type="number" value={newPromo.minOrder} onChange={e => setNewPromo(p => ({ ...p, minOrder: e.target.value }))} placeholder="0" />
              </div>
              <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleAddPromo} disabled={savingPromo}><Save size={14} /> {savingPromo ? 'Saving...' : 'Save'}</button>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAddingPromo(false)}>Cancel</button>
            </div>
          )}

          {promoCodes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>No promo codes yet. Add one to get started.</p>
          ) : (
            <table className="admin-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-white)', letterSpacing: 1 }}>{p.code}</td>
                    <td>{p.discount}%</td>
                    <td>{p.minOrder ? `PKR ${p.minOrder.toLocaleString()}` : 'None'}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: p.active ? '#34D399' : '#F87171' }}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDeletePromo(p)} disabled={deletingPromoId === p.id}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
