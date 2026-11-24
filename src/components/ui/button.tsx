
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: [
    'bg-gradient-to-br from-primary to-[#6042c5]',
    'dark:to-[#7652e8]',
    'text-primary-foreground',
    'shadow-md shadow-primary/20',
    'hover:shadow-lg hover:shadow-primary/30',
    'hover:brightness-110',
    'active:brightness-95',
  ].join(' '),

  outline: [
    'border border-input bg-card text-foreground',
    'hover:border-primary/50 hover:bg-accent',
    'hover:text-accent-foreground',
  ].join(' '),

  ghost: [
    'text-foreground',
    'hover:bg-accent hover:text-accent-foreground',
  ].join(' '),

  destructive: [
    'bg-gradient-to-br from-destructive to-[#b92f48]',
    'text-destructive-foreground',
    'shadow-md shadow-destructive/20',
    'hover:brightness-110',
    'active:brightness-95',
  ].join(' '),

  'destructive-outline': [
    'border border-destructive/50 text-destructive',
    'hover:bg-destructive/10 hover:border-destructive',
  ].join(' '),
} as const

const SIZES = {
  md: 'h-12 px-5 text-base',
  sm: 'h-11 px-4 text-sm',
  icon: 'size-12',
} as const

type Variant = keyof typeof VARIANTS
type Size = keyof typeof SIZES

export function buttonClass(
  variant: Variant = 'primary',
  size: Size = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-semibold tracking-[0.01em]',
    'transition-all duration-200 ease-out',
    'hover:-translate-y-0.5',
    'active:translate-y-0 active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'disabled:transform-none disabled:shadow-none',
    'motion-reduce:transition-none motion-reduce:transform-none',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

export type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
}

export function Button({
  variant,
  size,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  )
}
