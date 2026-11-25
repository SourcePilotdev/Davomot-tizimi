import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { createLesson, updateLesson, type Group, type Lesson } from '@/db'
import { useT } from '@/i18n'
import { toLocalDate, toLocalTime } from '@/lib/date'
import { errorMessage } from '@/lib/errors'

interface LessonFormDialogProps {
  open: boolean
  onClose: () => void
  groups: Group[]
  /** Berilsa — tahrirlash (darsning guruhi o'zgarmaydi), berilmasa — yangi dars */
  lesson?: Lesson
  /** Yangi dars uchun oldindan tanlangan guruh */
  defaultGroupId?: string
  /** Yangi dars yaratilgach chaqiriladi (odatda davomat ekraniga o'tish uchun) */
  onCreated?: (lesson: Lesson) => void
}

export function LessonFormDialog({ open, onClose, groups, lesson, defaultGroupId, onCreated }: LessonFormDialogProps) {
  const t = useT()
  return (
    <Dialog open={open} onClose={onClose} title={lesson ? t('lessons.form.editTitle') : t('lessons.form.addTitle')}>
      <LessonForm groups={groups} lesson={lesson} defaultGroupId={defaultGroupId} onCreated={onCreated} onClose={onClose} />
    </Dialog>
  )
}

interface FormErrors {
  group?: string
  date?: string
  time?: string
  form?: string
}

function LessonForm({ groups, lesson, defaultGroupId, onCreated, onClose }: Omit<LessonFormDialogProps, 'open'>) {
  const t = useT()
  const [groupId, setGroupId] = useState(lesson?.group_id ?? defaultGroupId ?? (groups.length === 1 ? groups[0].id : ''))
  const [date, setDate] = useState(lesson?.date ?? toLocalDate())
  const [time, setTime] = useState(lesson?.start_time ?? toLocalTime())
  const [topic, setTopic] = useState(lesson?.topic ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  // Foydalanuvchi maydonni o'zgartirsa, shu maydonning eski xatosi (va umumiy xato) yo'qoladi
  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      delete next.form
      return next
    })

  const lessonGroupName = lesson ? groups.find((group) => group.id === lesson.group_id)?.name : undefined

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const found: FormErrors = {}
    if (!lesson && !groupId) found.group = t('lessons.form.groupRequired')
    if (!date) found.date = t('lessons.form.dateRequired')
    if (!time) found.time = t('lessons.form.timeRequired')
    if (found.group || found.date || found.time) {
      setErrors(found)
      return
    }

    setSaving(true)
    setErrors({})
    try {
      if (lesson) {
        await updateLesson(lesson.id, { date, start_time: time, topic })
        onClose()
      } else {
        const created = await createLesson({ group_id: groupId, date, start_time: time, topic })
        onClose()
        onCreated?.(created)
      }
    } catch (e) {
      setErrors({ form: errorMessage(t, e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {lesson ? (
        lessonGroupName && <p className="-mt-2 text-muted-foreground">{lessonGroupName}</p>
      ) : (
        <Field label={t('lessons.form.group')} error={errors.group}>
          {(control) => (
            <Select
              {...control}
              value={groupId}
              onChange={(event) => {
                setGroupId(event.target.value)
                clearError('group')
              }}
            >
              <option value="" disabled>
                {t('lessons.form.groupPlaceholder')}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t('lessons.form.date')}
          error={errors.date}
          hint={date > toLocalDate() ? t('lessons.form.futureDate') : undefined}
        >
          {(control) => (
            <Input
              {...control}
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                clearError('date')
              }}
            />
          )}
        </Field>
        <Field label={t('lessons.form.time')} error={errors.time}>
          {(control) => (
            <Input
              {...control}
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value)
                clearError('time')
              }}
            />
          )}
        </Field>
      </div>

      <Field label={t('lessons.form.topic')}>
        {(control) => (
          <Input
            {...control}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={t('lessons.form.topicPlaceholder')}
            maxLength={200}
            autoComplete="off"
          />
        )}
      </Field>

      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {lesson ? t('common.save') : t('lessons.form.create')}
        </Button>
      </div>
    </form>
  )
}
