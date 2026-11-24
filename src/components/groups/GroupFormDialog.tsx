import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { createGroup, updateGroup, type Group } from '@/db'
import { useT } from '@/i18n'
import { errorMessage } from '@/lib/errors'

interface GroupFormDialogProps {
  open: boolean
  onClose: () => void
  /** Berilsa — tahrirlash, berilmasa — yangi guruh yaratish */
  group?: Group
}

export function GroupFormDialog({ open, onClose, group }: GroupFormDialogProps) {
  const t = useT()
  return (
    <Dialog open={open} onClose={onClose} title={group ? t('groups.form.editTitle') : t('groups.form.addTitle')}>
      <GroupForm group={group} onClose={onClose} />
    </Dialog>
  )
}

function GroupForm({ group, onClose }: { group?: Group; onClose: () => void }) {
  const t = useT()
  const [name, setName] = useState(group?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!name.trim()) {
      setError(t('groups.form.nameRequired'))
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (group) await updateGroup(group.id, { name })
      else await createGroup({ name })
      onClose()
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label={t('groups.form.name')} error={error}>
        {(control) => (
          <Input
            {...control}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            placeholder={t('groups.form.namePlaceholder')}
            maxLength={80}
            autoComplete="off"
            data-autofocus={group ? undefined : ''}
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
