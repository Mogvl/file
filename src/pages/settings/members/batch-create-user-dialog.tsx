import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { userApi } from '@/api/user'
import type { RoleListItem } from '@/types/role'
import { RoleOptionLabel } from './role-option-label'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BatchCreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleListItem[]
  onSuccess: () => void
}

interface ParsedUser {
  username: string
  nickname: string
  email?: string
  password?: string
}

function parseUsers(text: string): { users: ParsedUser[]; errors: string[] } {
  const users: ParsedUser[] = []
  const errors: string[] = []
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  lines.forEach((line, i) => {
    // 支持逗号或 Tab 分隔：用户名,昵称[,邮箱][,初始密码]
    const parts = line.split(/[\t,，]/).map((p) => p.trim())
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      errors.push(`${i + 1}: ${line}`)
      return
    }
    users.push({
      username: parts[0],
      nickname: parts[1],
      email: parts[2] || undefined,
      password: parts[3] || undefined,
    })
  })

  return { users, errors }
}

export function BatchCreateUserDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: BatchCreateUserDialogProps) {
  const { t } = useTranslation('settings')
  const [text, setText] = useState('')
  const [roleId, setRoleId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setText('')
      setRoleId('')
    }
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !roleId) {
      toast.error(t('members.batchDialog.fillAll'))
      return
    }
    const { users, errors } = parseUsers(text)
    if (users.length === 0) {
      toast.error(t('members.batchDialog.parseFailed'))
      return
    }
    if (errors.length > 0) {
      toast.error(t('members.batchDialog.parseError', { count: errors.length }))
      return
    }

    setLoading(true)
    try {
      const count = await userApi.batchCreateByAdmin({
        users,
        roleId: Number(roleId),
      })
      toast.success(t('members.batchDialog.created', { count }))
      handleOpenChange(false)
      onSuccess()
    } catch (err: any) {
      if (!err?.handled) toast.error(t('members.batchDialog.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('members.batchDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('members.batchDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='contents'>
          <div className='space-y-5'>
            <div className='space-y-3'>
              <Label htmlFor='batch-users'>
                <span className='relative top-0.5 text-red-500'>* </span>
                {t('members.batchDialog.users')}
              </Label>
              <Textarea
                id='batch-users'
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('members.batchDialog.placeholder')}
                rows={8}
                disabled={loading}
                className='font-mono text-sm'
              />
              <p className='text-xs text-muted-foreground'>
                {t('members.batchDialog.formatHint')}
              </p>
            </div>
            <div className='space-y-3'>
              <Label htmlFor='batch-role'>
                <span className='relative top-0.5 text-red-500'>* </span>
                {t('members.batchDialog.selectRole')}
              </Label>
              <Select value={roleId} onValueChange={setRoleId} disabled={loading}>
                <SelectTrigger id='batch-role' className='w-full'>
                  <SelectValue
                    placeholder={t('members.batchDialog.selectRolePlaceholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      <RoleOptionLabel role={role} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('members.batchDialog.cancel')}
            </Button>
            <Button type='submit' disabled={loading || !text.trim() || !roleId}>
              <Users className='mr-1.5 h-4 w-4' />
              {loading
                ? t('members.batchDialog.creating')
                : t('members.batchDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
