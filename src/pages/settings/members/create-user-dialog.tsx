import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { userApi } from '@/api/user'
import type { RoleListItem } from '@/types/role'
import { RoleOptionLabel } from './role-option-label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
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

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleListItem[]
  onSuccess: () => void
}

export function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: CreateUserDialogProps) {
  const { t } = useTranslation('settings')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [loading, setLoading] = useState(false)

  // 弹窗打开时，自动选中第一个角色
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // 关闭时清空表单
      setUsername('')
      setNickname('')
      setEmail('')
      setPassword('')
      setRoleId('')
    }
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !nickname.trim() || !email.trim() || !roleId) {
      toast.error(t('members.createDialog.fillAll'))
      return
    }
    if (password && password.length < 8) {
      toast.error(t('members.createDialog.passwordMin'))
      return
    }

    setLoading(true)
    try {
      await userApi.createByAdmin({
        username: username.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        roleId: Number(roleId),
      })
      toast.success(t('members.createDialog.created'))
      handleOpenChange(false)
      onSuccess()
    } catch (err: any) {
      if (!err?.handled) toast.error(t('members.createDialog.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('members.createDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='contents'>
          <div className='space-y-5'>
            <div className='space-y-3'>
              <Label htmlFor='create-username'>
                <span className='relative top-0.5 text-red-500'>* </span>
                {t('members.createDialog.username')}
              </Label>
              <Input
                id='create-username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='user001'
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-3'>
              <Label htmlFor='create-nickname'>
                <span className='relative top-0.5 text-red-500'>* </span>
                {t('members.createDialog.nickname')}
              </Label>
              <Input
                id='create-nickname'
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('members.createDialog.nicknamePlaceholder')}
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-3'>
              <Label htmlFor='create-email'>
                <span className='relative top-0.5 text-red-500'>* </span>
                {t('members.createDialog.email')}
              </Label>
              <Input
                id='create-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='user@example.com'
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-3'>
              <Label htmlFor='create-password'>
                {t('members.createDialog.password')}
              </Label>
              <Input
                id='create-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('members.createDialog.passwordPlaceholder')}
                disabled={loading}
              />
              <p className='text-xs text-muted-foreground'>
                {t('members.createDialog.passwordHint')}
              </p>
            </div>
            <div className='space-y-3'>
              <Label htmlFor='create-role'>
                <span className='relative top-0.5 text-red-500'>* </span>
                {t('members.createDialog.selectRole')}
              </Label>
              <Select value={roleId} onValueChange={setRoleId} disabled={loading}>
                <SelectTrigger id='create-role' className='w-full'>
                  <SelectValue
                    placeholder={t('members.createDialog.selectRolePlaceholder')}
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
              {t('members.createDialog.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={
                loading ||
                !username.trim() ||
                !nickname.trim() ||
                !email.trim() ||
                !roleId
              }
            >
              <UserPlus className='mr-1.5 h-4 w-4' />
              {loading
                ? t('members.createDialog.creating')
                : t('members.createDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
