import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'

interface TextAnimateProps {
  children: string
  type?: 'text' | 'word' | 'character'
  variant?: 'fadeIn' | 'blurIn' | 'slideUp' | 'glow'
  delay?: number
  staggerDelay?: number
  className?: string
}

const TextAnimate: React.FC<TextAnimateProps> = ({
  children,
  type = 'word',
  variant = 'slideUp',
  delay = 0,
  staggerDelay = 0.1,
  className,
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  const getAnimationStyle = (index: number): React.CSSProperties => {
    const d = index * staggerDelay

    switch (variant) {
      case 'fadeIn':
        return {
          opacity: visible ? 1 : 0,
          transition: `opacity 0.4s ease-out ${d}s`,
        }
      case 'blurIn':
        return {
          opacity: visible ? 1 : 0,
          filter: visible ? 'blur(0px)' : '10px',
          transition: `opacity 0.4s ease-out ${d}s, filter 0.4s ease-out ${d}s`,
        }
      case 'glow':
        return {
          opacity: visible ? 1 : 0,
          filter: visible ? 'blur(0px)' : '20px',
          transform: visible ? 'scale(1)' : 'scale(1.1)',
          transition: `opacity 0.6s ease-out ${d}s, filter 0.6s ease-out ${d}s, transform 0.6s ease-out ${d}s`,
        }
      case 'slideUp':
      default:
        return {
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: `opacity 0.4s ease-out ${d}s, transform 0.4s ease-out ${d}s`,
        }
    }
  }

  const splitText = (): string[] => {
    switch (type) {
      case 'character':
        return children.split('')
      case 'word':
        return children.split(' ')
      case 'text':
      default:
        return [children]
    }
  }

  const items = splitText()

  return (
    <span className={clsx('inline-block', className)}>
      {items.map((item, index) => (
        <span key={index} style={getAnimationStyle(index)}>
          {type === 'word' ? item + ' ' : item}
        </span>
      ))}
    </span>
  )
}

export default TextAnimate
