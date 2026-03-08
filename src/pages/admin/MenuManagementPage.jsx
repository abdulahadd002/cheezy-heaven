import { useState, useMemo, useRef } from 'react'
import { Loader, Search, Edit3, Trash2, X, Save, Upload, Plus } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { updateProduct, deleteProduct, createProduct } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

const CATEGORIES = ['pizza', 'appetizers', 'burgers', 'sandwiches', 'chicken', 'pasta', 'platters', 'fries', 'drinks']

const EMPTY_PRODUCT = {
  name: '', price: '', category: 'pizza', description: '', image: '',
  isAvailable: true, customizations: [],
}

export default function MenuManagementPage() {
  const { products, loading } = useProducts()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState(null) // product id being edited
  const [editData, setEditData] = useState({})
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const addFileRef = useRef(null)
  const [adding, setAdding] = useState(false)
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT)
  const [addUploading, setAddUploading] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

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
    const custPrices = product.customizationPrices || {}
    setEditData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || '',
      image: product.image || '',
      isAvailable: product.isAvailable !== false,
      customizations: (product.customizations || []).map(c => ({
        name: c,
        price: custPrices[c] || 0,
      })),
    })
  }

  const saveEdit = async () => {
    const parsedPrice = Number(editData.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      addToast('Please enter a valid price', 'error')
      return
    }
    setSavingEdit(true)
    const custNames = editData.customizations.map(c => c.name.trim()).filter(Boolean)
    const custPrices = {}
    editData.customizations.forEach(c => {
      if (c.name.trim()) custPrices[c.name.trim()] = Number(c.price) || 0
    })
    try {
      await updateProduct(editing, {
        name: editData.name,
        price: parsedPrice,
        category: editData.category,
        description: editData.description,
        image: editData.image,
        isAvailable: editData.isAvailable,
        customizations: custNames,
        customizationPrices: custPrices,
      })
      addToast('Product updated', 'success')
      setEditing(null)
    } catch {
      addToast('Failed to update product', 'error')
    }
    setSavingEdit(false)
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeletingId(product.id)
    try {
      await deleteProduct(product.id)
      addToast(`${product.name} deleted`, 'success')
    } catch {
      addToast('Failed to delete product', 'error')
    }
    setDeletingId(null)
  }

  const toggleAvailability = async (product) => {
    const newVal = product.isAvailable === false ? true : false
    setTogglingId(product.id)
    try {
      await updateProduct(product.id, { isAvailable: newVal })
      addToast(`${product.name} ${newVal ? 'enabled' : 'disabled'}`, 'success')
    } catch {
      addToast('Failed to update', 'error')
    }
    setTogglingId(null)
  }

  const compressImage = (file, callback) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      callback(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      callback(null)
    }
    img.src = blobUrl
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { addToast('Please select an image file', 'error'); return }
    setUploading(true)
    compressImage(file, (dataUrl) => {
      if (dataUrl) {
        setEditData(d => ({ ...d, image: dataUrl }))
        addToast('Image loaded', 'success')
      } else {
        addToast('Failed to load image', 'error')
      }
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  const handleAddImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { addToast('Please select an image file', 'error'); return }
    setAddUploading(true)
    compressImage(file, (dataUrl) => {
      if (dataUrl) {
        setNewProduct(d => ({ ...d, image: dataUrl }))
        addToast('Image loaded', 'success')
      } else {
        addToast('Failed to load image', 'error')
      }
      setAddUploading(false)
      if (addFileRef.current) addFileRef.current.value = ''
    })
  }

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) { addToast('Product name is required', 'error'); return }
    const parsedPrice = Number(newProduct.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) { addToast('Enter a valid price', 'error'); return }
    setAddSaving(true)
    const productId = `prod-${Date.now()}`
    const custNames = newProduct.customizations.map(c => c.name.trim()).filter(Boolean)
    const custPrices = {}
    newProduct.customizations.forEach(c => {
      if (c.name.trim()) custPrices[c.name.trim()] = Number(c.price) || 0
    })
    try {
      await createProduct(productId, {
        name: newProduct.name.trim(),
        price: parsedPrice,
        category: newProduct.category,
        description: newProduct.description.trim(),
        image: newProduct.image,
        isAvailable: newProduct.isAvailable,
        customizations: custNames,
        customizationPrices: custPrices,
        sizes: { small: parsedPrice, medium: Math.round(parsedPrice * 1.3), large: Math.round(parsedPrice * 1.6) },
      })
      addToast('Product created!', 'success')
      setAdding(false)
      setNewProduct(EMPTY_PRODUCT)
    } catch {
      addToast('Failed to create product', 'error')
    }
    setAddSaving(false)
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
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Menu Management</h1>
          <p>{products.length} products total</p>
        </div>
        {!adding && (
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {adding && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-white)', marginBottom: 16 }}>New Product</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <input className="admin-form-input" value={newProduct.name} onChange={e => setNewProduct(d => ({ ...d, name: e.target.value }))} placeholder="Product name" style={{ flex: '1 1 200px' }} />
            <select className="status-select" value={newProduct.category} onChange={e => setNewProduct(d => ({ ...d, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input className="admin-form-input" type="number" value={newProduct.price} onChange={e => setNewProduct(d => ({ ...d, price: e.target.value }))} placeholder="Price (PKR)" style={{ width: 130 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <input className="admin-form-input" value={newProduct.description} onChange={e => setNewProduct(d => ({ ...d, description: e.target.value }))} placeholder="Description (optional)" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <input className="admin-form-input" value={newProduct.image} onChange={e => setNewProduct(d => ({ ...d, image: e.target.value }))} placeholder="Image URL (or upload)" style={{ flex: '1 1 260px' }} />
            <input ref={addFileRef} type="file" accept="image/*" onChange={handleAddImageUpload} style={{ display: 'none' }} />
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => addFileRef.current?.click()} disabled={addUploading} style={{ whiteSpace: 'nowrap' }}>
              {addUploading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              {addUploading ? ' Uploading...' : ' Upload'}
            </button>
            {newProduct.image && <img src={newProduct.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-1)', marginBottom: 6 }}>Add-ons / Customizations</div>
            {newProduct.customizations.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <input className="admin-form-input" value={c.name} onChange={e => { const val = e.target.value; setNewProduct(d => { const u = [...d.customizations]; u[i] = { ...u[i], name: val }; return { ...d, customizations: u } }) }} placeholder="Add-on name" style={{ flex: '1 1 160px' }} />
                <input className="admin-form-input" type="number" value={c.price} onChange={e => { const val = e.target.value; setNewProduct(d => { const u = [...d.customizations]; u[i] = { ...u[i], price: val }; return { ...d, customizations: u } }) }} placeholder="Price" style={{ width: 80 }} />
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setNewProduct(d => ({ ...d, customizations: d.customizations.filter((_, j) => j !== i) }))}><X size={12} /></button>
              </div>
            ))}
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setNewProduct(d => ({ ...d, customizations: [...d.customizations, { name: '', price: 0 }] }))} style={{ marginTop: 4 }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleAddProduct} disabled={addSaving}>
              {addSaving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Save size={14} /> Create Product</>}
            </button>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setAdding(false); setNewProduct(EMPTY_PRODUCT) }}><X size={14} /> Cancel</button>
          </div>
        </div>
      )}

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
                      <td colSpan={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                              className="admin-form-input"
                              value={editData.name}
                              onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                              placeholder="Product name"
                              style={{ flex: '1 1 180px' }}
                            />
                            <select
                              className="status-select"
                              value={editData.category}
                              onChange={e => setEditData(d => ({ ...d, category: e.target.value }))}
                            >
                              {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                              ))}
                            </select>
                            <input
                              className="admin-form-input"
                              type="number"
                              value={editData.price}
                              onChange={e => setEditData(d => ({ ...d, price: e.target.value }))}
                              placeholder="Base price"
                              style={{ width: 100 }}
                            />
                            <button
                              className={`toggle-switch ${editData.isAvailable ? 'active' : ''}`}
                              onClick={() => setEditData(d => ({ ...d, isAvailable: !d.isAvailable }))}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                              className="admin-form-input"
                              value={editData.image}
                              onChange={e => setEditData(d => ({ ...d, image: e.target.value }))}
                              placeholder="Image URL (e.g. /images/product.jpg)"
                              style={{ flex: '1 1 260px' }}
                            />
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                            <button
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              title="Upload image"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {uploading
                                ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Upload size={14} />}
                              {uploading ? ' Uploading...' : ' Upload'}
                            </button>
                            {editData.image && (
                              <img src={editData.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-1)', marginBottom: 6 }}>Add-ons / Customizations</div>
                            {editData.customizations.map((c, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                                <input
                                  className="admin-form-input"
                                  value={c.name}
                                  onChange={e => {
                                    const val = e.target.value
                                    setEditData(d => {
                                      const updated = [...d.customizations]
                                      updated[i] = { ...updated[i], name: val }
                                      return { ...d, customizations: updated }
                                    })
                                  }}
                                  placeholder="Add-on name"
                                  style={{ flex: '1 1 160px' }}
                                />
                                <input
                                  className="admin-form-input"
                                  type="number"
                                  value={c.price}
                                  onChange={e => {
                                    const val = e.target.value
                                    setEditData(d => {
                                      const updated = [...d.customizations]
                                      updated[i] = { ...updated[i], price: val }
                                      return { ...d, customizations: updated }
                                    })
                                  }}
                                  placeholder="Price"
                                  style={{ width: 80 }}
                                />
                                <button
                                  className="admin-btn admin-btn-danger admin-btn-sm"
                                  onClick={() => {
                                    setEditData(d => ({ ...d, customizations: d.customizations.filter((_, j) => j !== i) }))
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              onClick={() => setEditData(d => ({
                                ...d,
                                customizations: [...d.customizations, { name: '', price: 0 }]
                              }))}
                              style={{ marginTop: 4 }}
                            >
                              + Add
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={saveEdit} disabled={savingEdit}>
                              <Save size={14} /> {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setEditing(null)}>
                              <X size={14} /> Cancel
                            </button>
                          </div>
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
                          ? (product.customizations || []).map(c => {
                              const p = product.customizationPrices?.[c]
                              return p ? `${c} (+${p})` : c
                            }).join(', ')
                          : <span style={{ color: 'var(--color-gray-2)' }}>—</span>}
                      </td>
                      <td>
                        <button
                          className={`toggle-switch ${product.isAvailable !== false ? 'active' : ''}`}
                          onClick={() => toggleAvailability(product)}
                          disabled={togglingId === product.id}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => startEdit(product)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(product)} disabled={deletingId === product.id}>
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
