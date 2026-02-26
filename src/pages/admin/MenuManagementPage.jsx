import { useState, useMemo } from 'react'
import { Loader, Search, Edit3, Trash2, X, Save } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { updateProduct, deleteProduct } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

const CATEGORIES = ['pizza', 'appetizers', 'burgers', 'sandwiches', 'chicken', 'pasta', 'platters', 'fries', 'drinks']

export default function MenuManagementPage() {
  const { products, loading } = useProducts()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState(null) // product id being edited
  const [editData, setEditData] = useState({})

  const filtered = useMemo(() => {
    let list = products
    if (catFilter !== 'all') list = list.filter(p => p.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q))
    }
    return list
  }, [products, catFilter, search])

  const startEdit = (product) => {
    setEditing(product.id)
    setEditData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || '',
      isAvailable: product.isAvailable !== false,
      customizations: (product.customizations || []).join(', '),
    })
  }

  const saveEdit = async () => {
    const parsedPrice = Number(editData.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      addToast('Please enter a valid price', 'error')
      return
    }
    try {
      await updateProduct(editing, {
        name: editData.name,
        price: parsedPrice,
        category: editData.category,
        description: editData.description,
        isAvailable: editData.isAvailable,
        customizations: editData.customizations.split(',').map(s => s.trim()).filter(Boolean),
      })
      addToast('Product updated', 'success')
      setEditing(null)
    } catch {
      addToast('Failed to update product', 'error')
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      addToast(`${product.name} deleted`, 'success')
    } catch {
      addToast('Failed to delete product', 'error')
    }
  }

  const toggleAvailability = async (product) => {
    const newVal = product.isAvailable === false ? true : false
    try {
      await updateProduct(product.id, { isAvailable: newVal })
      addToast(`${product.name} ${newVal ? 'enabled' : 'disabled'}`, 'success')
    } catch {
      addToast('Failed to update', 'error')
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
        <h1>Menu Management</h1>
        <p>{products.length} products total</p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-2)' }} />
          <input
            type="text"
            className="admin-form-input"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`admin-btn admin-btn-sm ${catFilter === 'all' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setCatFilter('all')}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`admin-btn admin-btn-sm ${catFilter === c ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setCatFilter(c)}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrapper">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            <h3>No products found</h3>
            <p>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Add-ons</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id}>
                  {editing === product.id ? (
                    <>
                      <td>
                        <input
                          className="admin-form-input"
                          value={editData.name}
                          onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                          style={{ width: 200 }}
                        />
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={editData.category}
                          onChange={e => setEditData(d => ({ ...d, category: e.target.value }))}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                        </select>
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
                        <input
                          className="admin-form-input"
                          value={editData.customizations}
                          onChange={e => setEditData(d => ({ ...d, customizations: e.target.value }))}
                          placeholder="e.g. Stuffed Crust, Extra Topping"
                          style={{ width: 240 }}
                        />
                        <div style={{ fontSize: 11, color: 'var(--color-gray-2)', marginTop: 3 }}>comma-separated</div>
                      </td>
                      <td>
                        <button
                          className={`toggle-switch ${editData.isAvailable ? 'active' : ''}`}
                          onClick={() => setEditData(d => ({ ...d, isAvailable: !d.isAvailable }))}
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {product.image && (
                            <img
                              src={product.image}
                              alt=""
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: product.isAvailable === false ? 'var(--color-gray-2)' : 'var(--color-white)' }}>
                              {product.name}
                            </div>
                            {product.discount > 0 && (
                              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{product.discount}% OFF</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                      <td style={{ fontWeight: 600 }}>PKR {product.price.toLocaleString()}</td>
                      <td style={{ fontSize: 13, color: 'var(--color-gray-1)', maxWidth: 220 }}>
                        {(product.customizations || []).length > 0
                          ? (product.customizations || []).join(', ')
                          : <span style={{ color: 'var(--color-gray-2)' }}>—</span>}
                      </td>
                      <td>
                        <button
                          className={`toggle-switch ${product.isAvailable !== false ? 'active' : ''}`}
                          onClick={() => toggleAvailability(product)}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => startEdit(product)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(product)}>
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
        )}
      </div>
    </div>
  )
}
