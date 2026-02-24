import { Check } from 'lucide-react'
import './StepIndicator.css'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}>
            <div className="step-number">
              {index < currentStep ? <Check size={16} /> : index + 1}
            </div>
            <span className="step-title">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`step-divider ${index < currentStep ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
