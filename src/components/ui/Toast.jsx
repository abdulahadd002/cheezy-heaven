import { X, Check, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import './Toast.css'

const icons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
}

export default function Toast() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || Check
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={18} />
            <span>{toast.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
