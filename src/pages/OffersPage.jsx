import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Moon, Sun, Flame, Crown, Utensils, Plus, ChevronDown } from 'lucide-react'
import deals from '../data/deals.json'

const CATEGORY_META = {
  midnight: { icon: Moon, color: '#6B3A3A' },
  lunch: { icon: Sun, color: '#A85C32' },
  pizzamania: { icon: Flame, color: '#8B2020' },
  premium: { icon: Crown, color: '#9B3030' },
  doubletrouble: { icon: Flame, color: '#A52D2D' },
  combos: { icon: Utensils, color: '#6B4030' },
  addon: { icon: Plus, color: '#5C3030' },
}

// Group deals by category
const grouped = deals.reduce((acc, deal) => {
  if (!acc[deal.category]) {
    acc[deal.category] = {
      title: deal.categoryTitle,
      time: deal.categoryTime,
      deals: []
    }
  }
  acc[deal.category].deals.push(deal)
  return acc
}, {})

export default function OffersPage() {
  const [expanded, setExpanded] = useState(null)

  const toggle = (key) => {
    setExpanded(prev => prev === key ? null : key)
  }

  return (
    <div style={{ padding: 'var(--space-32) 0 var(--space-96)' }}>
      <div className="container">
        <span className="label-text" style={{ color: 'var(--color-orange)', display: 'block', marginBottom: 8 }}>
          Save More
        </span>
        <h1 style={{
          fontWeight: 700,
          fontSize: 'clamp(32px, 5vw, 48px)',
          color: 'var(--color-white)',
          marginBottom: 'var(--space-16)',
          letterSpacing: '-0.02em'
        }}>
          Deals & Offers
        </h1>
        <p style={{ color: 'var(--color-gray-1)', marginBottom: 'var(--space-48)', fontSize: 16 }}>
          Free Home Delivery | Call: 051-5122227 / 0349-5479437
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {Object.entries(grouped).map(([catKey, catData]) => {
            const meta = CATEGORY_META[catKey] || { icon: Utensils, color: '#8B2020' }
            const Icon = meta.icon
            const isOpen = expanded === catKey

            return (
              <div
                key={catKey}
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${isOpen ? meta.color + '60' : 'var(--color-border)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Clickable Category Header */}
                <button
                  onClick={() => toggle(catKey)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-16)',
                    padding: 'var(--space-24) var(--space-32)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'inherit',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={24} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-white)', lineHeight: 1.3 }}>
                      {catData.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      {catData.time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-gray-2)' }}>
                          <Clock size={12} /> {catData.time}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>
                        {catData.deals.length} {catData.deals.length === 1 ? 'deal' : 'deals'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isOpen ? `${meta.color}20` : 'transparent',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}>
                    <ChevronDown
                      size={20}
                      style={{
                        color: isOpen ? meta.color : 'var(--color-gray-2)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease, color 0.3s ease'
                      }}
                    />
                  </div>
                </button>

                {/* Expandable Deal List */}
                <div style={{
                  maxHeight: isOpen ? `${catData.deals.length * 120 + 40}px` : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <div style={{
                    padding: '0 var(--space-32) var(--space-24)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 'var(--space-12)'
                  }}>
                    {catData.deals.map(deal => (
                      <div
                        key={deal.id}
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 10,
                          padding: 'var(--space-16) var(--space-24)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--space-16)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#8B202040'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-white)', marginBottom: 4 }}>
                            {deal.title}
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--color-gray-1)', lineHeight: 1.5 }}>
                            {deal.description}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-orange)', marginBottom: 6 }}>
                            PKR {deal.price.toLocaleString()}
                          </div>
                          <Link to="/menu" className="btn-primary btn-sm" style={{ fontSize: 11, padding: '6px 16px' }}>
                            Order
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
