import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Moon, Sun, Flame, Crown, Utensils, Plus } from 'lucide-react'
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-48)' }}>
          {Object.entries(grouped).map(([catKey, catData]) => {
            const meta = CATEGORY_META[catKey] || { icon: Utensils, color: '#8B2020' }
            const Icon = meta.icon
            return (
              <div key={catKey}>
                {/* Category Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-16)',
                  marginBottom: 'var(--space-24)'
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${meta.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={22} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: 24, color: 'var(--color-white)' }}>
                      {catData.title}
                    </h2>
                    {catData.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-gray-2)', marginTop: 2 }}>
                        <Clock size={12} /> {catData.time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-16)'
                }}>
                  {catData.deals.map(deal => (
                    <div
                      key={deal.id}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        padding: 'var(--space-24)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease',
                        cursor: 'default'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#8B202040'
                        e.currentTarget.style.boxShadow = '0 0 20px #8B202015'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-white)', marginBottom: 8 }}>
                          {deal.title}
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--color-gray-1)', lineHeight: 1.6 }}>
                          {deal.description}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 'var(--space-16)', paddingTop: 'var(--space-12)',
                        borderTop: '1px solid var(--color-border)'
                      }}>
                        <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-orange)' }}>
                          PKR {deal.price.toLocaleString()}
                        </span>
                        <Link to="/menu" className="btn-primary btn-sm">
                          Order
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
