import { useEffect, useState } from 'react'

interface BlurFadeProps {
  children: React.ReactNode
  duration?: number
  delay?: number
  yOffset?: number
  blur?: string
  inView?: boolean
  className?: string
}

const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  blur = '6px',
  inView = true,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(!inView)

  useEffect(() => {
    if (!inView) return

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay, inView])

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    filter: isVisible ? 'blur(0px)' : blur,
    transform: isVisible ? 'translateY(0)' : `translateY(${yOffset}px)`,
    transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s, filter ${duration}s ease-out ${delay}s`,
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export default BlurFade
