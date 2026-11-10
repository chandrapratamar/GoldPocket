import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

type ButtonVariant = 'gold' | 'outline' | 'ghost'
type ButtonSize = 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  gold: 'btn-gold text-bg hover:brightness-105 active:scale-[0.98] disabled:bg-none disabled:bg-card-elevated disabled:text-text-dim',
  outline:
    'hairline-gold bg-transparent text-gold-accent hover:bg-gold/10 active:scale-[0.98] disabled:border-white/10 disabled:text-text-dim disabled:hover:bg-transparent',
  ghost: 'text-text-muted hover:text-text hover:bg-card-elevated/60 disabled:text-text-dim',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-14 px-5 text-base',
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light disabled:cursor-not-allowed disabled:pointer-events-none'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function buttonStyles(variant: ButtonVariant, size: ButtonSize = 'md'): string {
  return cn(baseClasses, sizeClasses[size], variantClasses[variant])
}

export function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner className="size-5" label="Working" /> : null}
      {children}
    </button>
  )
}
