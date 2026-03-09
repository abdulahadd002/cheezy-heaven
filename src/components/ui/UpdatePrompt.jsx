import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onControllerChange = () => {
      setShowUpdate(true)
    }

    // Listen for new service worker waiting
    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg)
      if (reg.waiting) {
        setShowUpdate(true)
        return
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true)
          }
        })
      })
    })

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="update-prompt">
      <RefreshCw size={16} />
      <span>New version available</span>
      <button onClick={handleUpdate}>Update</button>
    </div>
  )
}
