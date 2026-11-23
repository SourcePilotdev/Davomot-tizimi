import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind sinflarini birlashtiradi (shadcn/ui ning standart yordamchisi). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
