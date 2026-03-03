import { useState } from 'react'
import { Loader, Edit3, Trash2, Save, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useDeals } from '../../hooks/useDeals'
import { useProducts } from '../../hooks/useProducts'
import { updateDeal, deleteDeal, createDeal } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

const EMPTY_DEAL = { title: '', price: '', items: [], category: '', categoryTitle: '', startTime: '', endTime: '' }

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function buildTimeString(start, end) {
  if (!start && !end) return 'All Day'
  return `${formatTime12(start)} to ${formatTime12(end)}`
}

export default function DealsManagementPage() {
  const { deals, loading } = useDeals()
  const { products } = useProducts()
  const { addToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const [newDeal, setNewDeal] = useState(EMPTY_DEAL)
  const [itemsOpen, setItemsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Group by category for display
  const grouped = deals.reduce((acc, deal) => {
    if (!acc[deal.category]) {
      acc[deal.category] = { title: deal.categoryTitle, deals: [] }
    }
    acc[deal.category].deals.push(deal)
    return acc
  }, {})

  const startEdit = (deal) => {
    setEditing(deal.id)
    setEditData({
      title: deal.title,
      description: deal.description || '',
      price: deal.price,
    })
  }

  const saveEdit = async () => {
    const parsedPrice = Number(editData.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      addToast('Please enter a valid price', 'error')
      return
    }
    setSavingEdit(true)
    try {
      await updateDeal(editing, {
        title: editData.title,
        description: editData.description,
        price: parsedPrice,
      })
      addToast('Deal updated', 'success')
      setEditing(null)
    } catch {
      addToast('Failed to update deal', 'error')
    }
    setSavingEdit(false)
  }

  const handleDelete = async (deal) => {
    if (!window.confirm(`Delete "${deal.title}"?`)) return
    setDeletingId(deal.id)
    try {
      await deleteDeal(deal.id)
      addToast(`Deal deleted`, 'success')
    } catch {
      addToast('Failed to delete deal', 'error')
    }
    setDeletingId(null)
  }

  // Extract existing categories for the dropdown
  const existingCategories = Object.values(
    deals.reduce((acc, d) => {
      if (!acc[d.category]) acc[d.category] = { key: d.category, title: d.categoryTitle, time: d.categoryTime }
      return acc
    }, {})
  )

  const handleCategorySelect = (catKey) => {
    if (catKey === '__new__') {
      setNewDeal(d => ({ ...d, category: '', categoryTitle: '', startTime: '', endTime: '' }))
    } else {
      const cat = existingCategories.find(c => c.key === catKey)
      if (cat) setNewDeal(d => ({ ...d, category: cat.key, categoryTitle: cat.title }))
    }
  }

  const toggleItem = (productName) => {
    setNewDeal(d => {
      const exists = d.items.find(i => i.name === productName)
      if (exists) return { ...d, items: d.items.filter(i => i.name !== productName) }
      return { ...d, items: [...d.items, { name: productName, qty: 1 }] }
    })
  }

  const updateItemQty = (productName, qty) => {
    setNewDeal(d => ({
      ...d,
      items: d.items.map(i => i.name === productName ? { ...i, qty: Math.max(1, qty) } : i)
    }))
  }

  const buildDescription = (items) => {
    return items.map(i => `${i.qty}x ${i.name}`).join(' + ')
  }

  const handleCreateDeal = async () => {
    if (!newDeal.title.trim()) {
      addToast('Deal title is required', 'error')
      return
    }
    if (newDeal.items.length === 0) {
      addToast('Select at least one menu item', 'error')
      return
    }
    const parsedPrice = Number(newDeal.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      addToast('Please enter a valid price', 'error')
      return
    }
    if (!newDeal.category.trim() || !newDeal.categoryTitle.trim()) {
      addToast('Category is required', 'error')
      return
    }
    setSaving(true)
    const dealId = `deal-${Date.now()}`
    try {
      await createDeal(dealId, {
        title: newDeal.title.trim(),
        description: buildDescription(newDeal.items),
        price: parsedPrice,
        category: newDeal.category.trim(),
        categoryTitle: newDeal.categoryTitle.trim(),
        categoryTime: buildTimeString(newDeal.startTime, newDeal.endTime),
      })
      addToast('Deal created', 'success')
      setAdding(false)
      setNewDeal(EMPTY_DEAL)
      setItemsOpen(false)
    } catch (err) {
      console.error('Create deal error:', err)
      addToast('Failed to create deal — check admin permissions', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Group products by category for the selector
  const productsByCategory = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Deals Management</h1>
          <p>{deals.length} deals across {Object.keys(grouped).length} categories</p>
        </div>
        {!adding && (
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add Deal
          </button>
        )}
      </div>

      {adding && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-white)', marginBottom: 16 }}>New Deal</h3>

          {/* Title & Price */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <input
              className="admin-form-input"
              value={newDeal.title}
              onChange={e => setNewDeal(d => ({ ...d, title: e.target.value }))}
              placeholder="Deal title (e.g. Family Combo)"
              style={{ flex: '1 1 200px' }}
            />
            <input
              className="admin-form-input"
              type="number"
              value={newDeal.price}
              onChange={e => setNewDeal(d => ({ ...d, price: e.target.value }))}
              placeholder="Price (PKR)"
              style={{ width: 130 }}
            />
          </div>

          {/* Items Selector */}
          <div style={{ marginBottom: 12 }}>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setItemsOpen(!itemsOpen)}
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>
                {newDeal.items.length === 0
                  ? 'Select menu items included in this deal'
                  : buildDescription(newDeal.items)}
              </span>
              {itemsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {itemsOpen && (
              <div style={{
                border: '1px solid #2A1A2E',
                borderRadius: '0 0 8px 8px',
                background: '#0D0A0E',
                maxHeight: 280,
                overflowY: 'auto',
                padding: 12,
              }}>
                {Object.entries(productsByCategory).map(([cat, prods]) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      {cat}
                    </div>
                    {prods.map(p => {
                      const selected = newDeal.items.find(i => i.name === p.name)
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                            borderRadius: 6, cursor: 'pointer',
                            background: selected ? 'rgba(255,140,50,0.1)' : 'transparent',
                          }}
                          onClick={() => toggleItem(p.name)}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: selected ? '2px solid var(--color-orange)' : '2px solid #3A2A3E',
                            background: selected ? 'var(--color-orange)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, color: '#fff', flexShrink: 0,
                          }}>
                            {selected && '✓'}
                          </div>
                          <span style={{ flex: 1, fontSize: 13, color: 'var(--color-white)' }}>{p.name}</span>
                          {selected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                              <button
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                style={{ padding: '2px 6px', minWidth: 0 }}
                                onClick={() => updateItemQty(p.name, selected.qty - 1)}
                              >-</button>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-white)', minWidth: 18, textAlign: 'center' }}>
                                {selected.qty}
                              </span>
                              <button
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                style={{ padding: '2px 6px', minWidth: 0 }}
                                onClick={() => updateItemQty(p.name, selected.qty + 1)}
                              >+</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <select
              className="status-select"
              value={existingCategories.find(c => c.key === newDeal.category) ? newDeal.category : '__new__'}
              onChange={e => handleCategorySelect(e.target.value)}
            >
              <option value="__new__">New category...</option>
              {existingCategories.map(c => (
                <option key={c.key} value={c.key}>{c.title}</option>
              ))}
            </select>
            {!existingCategories.find(c => c.key === newDeal.category) && (
              <>
                <input
                  className="admin-form-input"
                  value={newDeal.category}
                  onChange={e => setNewDeal(d => ({ ...d, category: e.target.value }))}
                  placeholder="Category key (e.g. lunch)"
                  style={{ width: 150 }}
                />
                <input
                  className="admin-form-input"
                  value={newDeal.categoryTitle}
                  onChange={e => setNewDeal(d => ({ ...d, categoryTitle: e.target.value }))}
                  placeholder="Category name (e.g. Lunch Deals)"
                  style={{ width: 200 }}
                />
              </>
            )}
          </div>

          {/* Time Picker */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-1)' }}>Available:</span>
            <input
              className="admin-form-input"
              type="time"
              value={newDeal.startTime}
              onChange={e => setNewDeal(d => ({ ...d, startTime: e.target.value }))}
              style={{ width: 130 }}
            />
            <span style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>to</span>
            <input
              className="admin-form-input"
              type="time"
              value={newDeal.endTime}
              onChange={e => setNewDeal(d => ({ ...d, endTime: e.target.value }))}
              style={{ width: 130 }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-gray-2)' }}>(leave empty for All Day)</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={handleCreateDeal}
              disabled={saving}
            >
              {saving
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                : <><Save size={14} /> Create Deal</>}
            </button>
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => { setAdding(false); setNewDeal(EMPTY_DEAL); setItemsOpen(false) }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([catKey, catData]) => (
        <div key={catKey} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-white)', marginBottom: 12 }}>
            {catData.title}
          </h2>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catData.deals.map(deal => (
                  <tr key={deal.id}>
                    {editing === deal.id ? (
                      <>
                        <td>
                          <input
                            className="admin-form-input"
                            value={editData.title}
                            onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                            style={{ width: 200 }}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-form-input"
                            value={editData.description}
                            onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                            style={{ width: 280 }}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-form-input"
                            type="number"
                            value={editData.price}
                            onChange={e => setEditData(d => ({ ...d, price: e.target.value }))}
                            style={{ width: 100 }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={saveEdit} disabled={savingEdit}>
                              <Save size={14} /> {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setEditing(null)}>
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 600, color: 'var(--color-white)' }}>{deal.title}</td>
                        <td style={{ fontSize: 13, maxWidth: 300 }}>{deal.description}</td>
                        <td style={{ fontWeight: 600 }}>PKR {(deal.price || 0).toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => startEdit(deal)}>
                              <Edit3 size={14} />
                            </button>
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(deal)} disabled={deletingId === deal.id}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
