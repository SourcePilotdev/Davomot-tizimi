import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: 'before:content-["✦"] before:text-base before:leading-none bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/35 hover:brightness-110',
  outline: 'before:content-["✧"] before:text-base before:leading-none border border-border/80 bg-card/80 text-foreground shadow-sm hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300',
  ghost: 'before:content-["✧"] before:text-base before:leading-none text-foreground hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300',
  destructive: 'before:content-["🗑️"] before:text-sm bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110',
  'destructive-outline': 'before:content-["🗑️"] before:text-sm border border-rose-500/40 bg-rose-500/5 text-rose-600 hover:border-rose-500 hover:bg-rose-500/15 dark:text-rose-300',
} as const

const SIZES = {
  md: 'min-h-12 px-5 text-sm sm:text-base',
  sm: 'min-h-10 px-4 text-sm',
  icon: 'size-11',
} as const

type Variant = keyof typeof VARIANTS
type Size = keyof typeof SIZES

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  return cn(
    'group inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-[0.01em]',
    'transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:transform-none',
    'motion-reduce:transition-none motion-reduce:transform-none',
    VARIANTS[variant], SIZES[size], size === 'icon' && 'before:hidden', className,
  )
}

export type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size }

export function Button({ variant = 'primary', size = 'md', type = 'button', className, ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}
