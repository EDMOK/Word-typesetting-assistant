import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  soft?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = false,
  soft = false,
  hover = false,
  padding = 'lg',
}) => {
  const paddings = {
    none: '',
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-3 sm:p-5 md:p-6',
  }

  const cardStyles = clsx(
    'relative rounded-xl transition-all duration-300',
    glass && 'glass-card',
    soft && 'soft-card',
    hover && 'hover:shadow-glass-hover hover:-translate-y-0.5 hover:border-primary-300/70 cursor-pointer',
    paddings[padding],
    className
  )

  return <div className={cardStyles}>{children}</div>
}

export default Card
