import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground active:opacity-90',
  outline: 'border border-input bg-card text-foreground active:bg-accent',
  ghost: 'text-foreground active:bg-accent',
  destructive: 'bg-destructive text-destructive-foreground active:opacity-90',
  'destructive-outline': 'border border-destructive text-destructive active:bg-destructive/10',
} as const

// Barcha o'lchamlar kamida 44px: barmoq bilan bosish uchun qulay
const SIZES = {
  md: 'h-12 px-5 text-base',
  sm: 'h-11 px-4 text-sm',
  icon: 'size-12',
} as const

type Variant = keyof typeof VARIANTS
type Size = keyof typeof SIZES

/** Tugma sinflari. Havolani (<Link>) tugma ko'rinishiga keltirish uchun ham ishlatiladi. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

export type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size }

/** type="button" standart: forma ichida tasodifan yuborishning oldini oladi. Yuborish uchun type="submit" bering. */
export function Button({ variant, size, type = 'button', className, ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}
