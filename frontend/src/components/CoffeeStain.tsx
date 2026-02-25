import React from 'react'

interface CoffeeStainProps {
  className?: string
}

const CoffeeStain: React.FC<CoffeeStainProps> = ({ className }) => {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none">
      <ellipse
        cx="100"
        cy="100"
        rx="80"
        ry="70"
        fill="url(#coffeeGradient)"
        opacity="0.15"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="70"
        ry="60"
        fill="url(#coffeeGradient2)"
        opacity="0.1"
      />
      <defs>
        <radialGradient id="coffeeGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(70 80)">
          <stop offset="0%" stopColor="#D2691E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="coffeeGradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(60 70)">
          <stop offset="0%" stopColor="#D2691E" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="0.05" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export default CoffeeStain
