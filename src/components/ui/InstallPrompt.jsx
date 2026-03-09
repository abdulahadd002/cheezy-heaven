import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detect if app gets installed
    window.addEventListener('appinstalled', () => setIsInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled || dismissed || !deferredPrompt) return null

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <Download size={20} style={{ color: 'var(--color-orange)', flexShrink: 0 }} />
        <div>
          <strong>Install Cheezy Heaven</strong>
          <span>Get quick access from your home screen</span>
        </div>
      </div>
      <div className="install-prompt-actions">
        <button className="install-prompt-btn" onClick={handleInstall}>Install</button>
        <button className="install-prompt-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
