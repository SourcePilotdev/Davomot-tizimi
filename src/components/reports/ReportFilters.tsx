import { Field, Input, Select } from '@/components/ui/field'
import type { Group } from '@/db'
import { useT } from '@/i18n'
import { PERIOD_PRESETS, type PeriodPreset } from '@/lib/period'

interface ReportFiltersProps {
  /** Berilmasa, guruh tanlash ko'rsatilmaydi (masalan, bitta o'quvchi sahifasida) */
  groups?: Group[]
  groupId?: string
  onGroupChange?: (groupId: string) => void
  preset: PeriodPreset
  onPresetChange: (preset: PeriodPreset) => void
  custom: { from: string; to: string }
  onCustomChange: (custom: { from: string; to: string }) => void
}

/** Guruh va davr tanlash. "Boshqa davr" tanlansa, ikkita sana maydoni chiqadi. */
export function ReportFilters({
  groups,
  groupId = '',
  onGroupChange,
  preset,
  onPresetChange,
  custom,
  onCustomChange,
}: ReportFiltersProps) {
  const t = useT()

  return (
    <div className="space-y-3">
      {groups && onGroupChange && (
        <Select aria-label={t('reports.group')} value={groupId} onChange={(event) => onGroupChange(event.target.value)}>
          <option value="">{t('reports.allGroups')}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      )}
      <Select
        aria-label={t('reports.period')}
        value={preset}
        onChange={(event) => {
          const next = PERIOD_PRESETS.find((option) => option === event.target.value)
          if (next) onPresetChange(next)
        }}
      >
        {PERIOD_PRESETS.map((option) => (
          <option key={option} value={option}>
            {t(`reports.periods.${option}`)}
          </option>
        ))}
      </Select>
      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('reports.from')}>
            {(control) => (
              <Input {...control} type="date" value={custom.from} onChange={(event) => onCustomChange({ ...custom, from: event.target.value })} />
            )}
          </Field>
          <Field label={t('reports.to')}>
            {(control) => (
              <Input {...control} type="date" value={custom.to} onChange={(event) => onCustomChange({ ...custom, to: event.target.value })} />
            )}
          </Field>
        </div>
      )}
    </div>
  )
}
