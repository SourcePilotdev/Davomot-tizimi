import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteStudent, getStudentImpact, type Group, type Student } from '@/db'
import { useT } from '@/i18n'
import { StudentFormDialog } from './StudentFormDialog'

interface FormState {
  open: boolean
  student?: Student
  defaultGroupId?: string
}

interface PendingDelete {
  student: Student
  records: number
}

/**
 * O'quvchi qo'shish / tahrirlash / o'chirish oqimi (forma + tasdiq oynasi) bir joyda.
 * Ikki sahifada (Guruh va O'quvchilar) bir xil ishlatiladi:
 *   const editor = useStudentEditor(groups)
 *   <Button onClick={() => editor.openCreate()} />   ...   {editor.dialogs}
 */
export function useStudentEditor(groups: Group[]) {
  const t = useT()
  const [form, setForm] = useState<FormState>({ open: false })
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const closeForm = () => setForm((current) => (current.open ? { open: false } : current))

  async function requestDelete(student: Student) {
    closeForm()
    const { attendance } = await getStudentImpact(student.id)
    setPendingDelete({ student, records: attendance })
  }

  const dialogs = (
    <>
      <StudentFormDialog
        open={form.open}
        onClose={closeForm}
        groups={groups}
        student={form.student}
        defaultGroupId={form.defaultGroupId}
        onDelete={requestDelete}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('students.deleteTitle')}
        message={t('students.deleteMessage', { name: pendingDelete?.student.full_name ?? '' })}
        details={
          pendingDelete && pendingDelete.records > 0
            ? t('students.deleteImpact', { records: pendingDelete.records })
            : t('students.deleteNoRecords')
        }
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (!pendingDelete) return
          await deleteStudent(pendingDelete.student.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )

  return {
    openCreate: (defaultGroupId?: string) => setForm({ open: true, defaultGroupId }),
    openEdit: (student: Student) => setForm({ open: true, student }),
    dialogs,
  }
}
