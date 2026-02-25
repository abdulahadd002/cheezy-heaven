import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const info = [
  { icon: MapPin, title: 'Address', text: 'Rizwan Plaza Opp, Man O Salwa Sweets, Old Lalazar, Rawalpindi' },
  { icon: Phone, title: 'Phone', text: '051-5122227 / 0349-5479437' },
  { icon: Mail, title: 'Email', text: 'hello@cheezyheaven.pk' },
  { icon: Clock, title: 'Hours', text: '11:00 AM - 3:00 AM (Daily)' },
]

export default function ContactPage() {
  const { addToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(form.subject || 'Message from Cheezy Heaven website')
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`)
    window.open(`mailto:info@cheezyheaven.pk?subject=${subject}&body=${body}`, '_blank')
    addToast('Opening your email client to send the message.', 'success')
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div style={{ padding: 'var(--space-32) 0 var(--space-96)' }}>
      <div className="container">
        <span className="label-text" style={{ color: 'var(--color-orange)', display: 'block', marginBottom: 8 }}>
          Get In Touch
        </span>
        <h1 style={{
          fontWeight: 700,
          fontSize: 'clamp(32px, 5vw, 48px)',
          color: 'var(--color-white)',
          marginBottom: 'var(--space-48)',
          letterSpacing: '-0.02em'
        }}>
          Contact Us
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-48)',
        }}>
          {/* Contact Info */}
          <div>
            <p style={{ fontSize: 16, color: 'var(--color-gray-1)', lineHeight: 1.7, marginBottom: 'var(--space-32)' }}>
              Have a question, feedback, or special request? We'd love to hear from you.
              Call us directly or drop us a message and we'll get back to you as soon as possible.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
              {info.map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 'var(--space-16)', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(139, 32, 32, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <item.icon size={20} style={{ color: 'var(--color-orange)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-white)', fontSize: 14, marginBottom: 2 }}>
                      {item.title}
                    </div>
                    <div style={{ color: 'var(--color-gray-1)', fontSize: 14 }}>
                      {item.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 'var(--space-32)'
            }}
          >
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-input"
                placeholder="What's this about?"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Tell us more..."
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
                style={{ resize: 'vertical', minHeight: 120 }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              <Send size={16} /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
