import type { AttendanceStatus } from '@/db'

/**
 * Davomat holatlarining ranglari (tokenlar: index.css). Sinf nomlari TO'LIQ yozilgan:
 * Tailwind faqat shunday yozilgan sinflarni topadi (`bg-${x}` kabi yig'ib bo'lmaydi).
 */
export const STATUS_STYLES: Record<AttendanceStatus, { selected: string; dot: string }> = {
  present: { selected: 'border-present bg-present text-present-foreground', dot: 'bg-present' },
  absent: { selected: 'border-absent bg-absent text-absent-foreground', dot: 'bg-absent' },
  late: { selected: 'border-late bg-late text-late-foreground', dot: 'bg-late' },
  excused: { selected: 'border-excused bg-excused text-excused-foreground', dot: 'bg-excused' },
}
