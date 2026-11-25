import { useState, type FormEvent } from 'react'
import { TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { createStudent, updateStudent, type Group, type Student, type StudentStatus } from '@/db'
import { useT } from '@/i18n'
import { errorMessage } from '@/lib/errors'

interface StudentFormDialogProps {
  open: boolean
  onClose: () => void
  groups: Group[]
  /** Berilsa — tahrirlash, berilmasa — yangi o'quvchi */
  student?: Student
  /** Yangi o'quvchi uchun oldindan tanlangan guruh */
  defaultGroupId?: string
  /** Tahrirlash oynasidagi "O'chirish" tugmasi bosilganda */
  onDelete?: (student: Student) => void
}

export function StudentFormDialog({ open, onClose, groups, student, defaultGroupId, onDelete }: StudentFormDialogProps) {
  const t = useT()
  return (
    <Dialog open={open} onClose={onClose} title={student ? t('students.form.editTitle') : t('students.form.addTitle')}>
      <StudentForm groups={groups} student={student} defaultGroupId={defaultGroupId} onClose={onClose} onDelete={onDelete} />
    </Dialog>
  )
}

interface FormErrors {
  fullName?: string
  group?: string
  form?: string
}

function StudentForm({
  groups,
  student,
  defaultGroupId,
  onClose,
  onDelete,
}: Omit<StudentFormDialogProps, 'open'>) {
  const t = useT()
  const [fullName, setFullName] = useState(student?.full_name ?? '')
  const [groupId, setGroupId] = useState(student?.group_id ?? defaultGroupId ?? '')
  const [phone, setPhone] = useState(student?.phone ?? '')
  const [parentPhone, setParentPhone] = useState(student?.parent_phone ?? '')
  const [status, setStatus] = useState<StudentStatus>(student?.status ?? 'active')
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const found: FormErrors = {}
    if (!fullName.trim()) found.fullName = t('students.form.fullNameRequired')
    if (!groupId) found.group = t('students.form.groupRequired')
    if (found.fullName || found.group) {
      setErrors(found)
      return
    }

    setSaving(true)
    setErrors({})
    try {
      const data = { group_id: groupId, full_name: fullName, phone, parent_phone: parentPhone, status }
      if (student) await updateStudent(student.id, data)
      else await createStudent(data)
      onClose()
    } catch (e) {
      setErrors({ form: errorMessage(t, e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label={t('students.form.fullName')} error={errors.fullName}>
        {(control) => (
          <Input
            {...control}
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value)
              clearError('fullName')
            }}
            placeholder={t('students.form.fullNamePlaceholder')}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="words"
            data-autofocus={student ? undefined : ''}
          />
        )}
      </Field>

      <Field label={t('students.form.group')} error={errors.group}>
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
              {t('students.form.groupPlaceholder')}
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={t('students.form.phone')}>
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t('students.form.phonePlaceholder')}
            autoComplete="off"
          />
        )}
      </Field>

      <Field label={t('students.form.parentPhone')}>
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            value={parentPhone}
            onChange={(event) => setParentPhone(event.target.value)}
            placeholder={t('students.form.phonePlaceholder')}
            autoComplete="off"
          />
        )}
      </Field>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium">{t('students.form.status')}</span>
        <SegmentedControl
          label={t('students.form.status')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: t('status.active') },
            { value: 'inactive', label: t('status.inactive') },
          ]}
        />
        <p className="text-sm text-muted-foreground">{t('students.form.statusHint')}</p>
      </div>

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
          {t('common.save')}
        </Button>
      </div>

      {student && onDelete && (
        <Button variant="destructive-outline" className="w-full" onClick={() => onDelete(student)} disabled={saving}>
          <TrashIcon className="size-5" />
          {t('common.delete')}
        </Button>
      )}
    </form>
  )
}
