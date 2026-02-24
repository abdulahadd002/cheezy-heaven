import { Award, Clock, MapPin, Phone, Truck } from 'lucide-react'

const stats = [
  { icon: MapPin, value: 'Rawalpindi', label: 'Old Lalazar, RWP' },
  { icon: Clock, value: '11 AM - 3 AM', label: 'Open Daily' },
  { icon: Truck, value: 'Free', label: 'Home Delivery' },
  { icon: Phone, value: '051-5122227', label: 'Call & Order' },
]

export default function AboutPage() {
  return (
    <div style={{ padding: 'var(--space-32) 0 var(--space-96)' }}>
      <div className="container">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <span className="label-text" style={{ color: 'var(--color-orange)', display: 'block', marginBottom: 8 }}>
            Our Story
          </span>
          <h1 style={{
            fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 48px)',
            color: 'var(--color-white)',
            marginBottom: 'var(--space-24)',
            letterSpacing: '-0.02em'
          }}>
            About Cheezy Heaven
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--color-gray-1)', marginBottom: 'var(--space-24)' }}>
            Where Every Bite is a Cheezy Delight! Cheezy Heaven is Rawalpindi's go-to destination
            for premium pizzas, loaded burgers, crispy chicken, and irresistible deals. Located in
            Old Lalazar, we're committed to delivering mouth-watering food right to your doorstep.
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-gray-1)', marginBottom: 'var(--space-48)' }}>
            From our Elite and Cheezy pizza ranges to our signature Cheezy Heaven Special, every
            item on our menu is crafted with the finest ingredients and a love for great food. Whether
            you're craving a midnight snack or a hearty lunch deal, we've got you covered with
            free home delivery across Rawalpindi.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-24)',
            marginBottom: 'var(--space-64)'
          }}>
            {stats.map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 'var(--space-24)',
                  textAlign: 'center'
                }}
              >
                <stat.icon
                  size={28}
                  style={{ color: 'var(--color-orange)', marginBottom: 12 }}
                />
                <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--color-white)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-gray-2)', marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: 'var(--space-48)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 28, color: 'var(--color-white)', marginBottom: 12 }}>
              Our Promise
            </h2>
            <p style={{ fontSize: 18, color: 'var(--color-gray-1)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
              Premium quality food, generous portions, and free home delivery — making every meal
              a cheezy delight for Rawalpindi and beyond.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
