import { useState } from 'react'
import { Loader, Edit3, Trash2, Save, X } from 'lucide-react'
import { useDeals } from '../../hooks/useDeals'
import { updateDeal, deleteDeal } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

export default function DealsManagementPage() {
  const { deals, loading } = useDeals()
  const { addToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})

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
      description: deal.description,
      price: deal.price,
    })
  }

  const saveEdit = async () => {
    try {
      await updateDeal(editing, {
        title: editData.title,
        description: editData.description,
        price: Number(editData.price),
      })
      addToast('Deal updated', 'success')
      setEditing(null)
    } catch {
      addToast('Failed to update deal', 'error')
    }
  }

  const handleDelete = async (deal) => {
    if (!window.confirm(`Delete "${deal.title}"?`)) return
    try {
      await deleteDeal(deal.id)
      addToast(`Deal deleted`, 'success')
    } catch {
      addToast('Failed to delete deal', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Deals Management</h1>
        <p>{deals.length} deals across {Object.keys(grouped).length} categories</p>
      </div>

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
                            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={saveEdit}>
                              <Save size={14} /> Save
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
                        <td style={{ fontWeight: 600 }}>PKR {deal.price.toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => startEdit(deal)}>
                              <Edit3 size={14} />
                            </button>
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(deal)}>
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
