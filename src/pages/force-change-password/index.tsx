import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { PasswordChangeForm } from '@/pages/settings/profile/account-forms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 强制修改密码页
 * 管理员新建的用户首次登录后跳转到此页，改密成功后才允许继续使用系统。
 */
export default function ForceChangePasswordPage() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const isForceChange = user?.forceChangePassword === 1

  // 若用户已经不需要强制改密（例如已改过），自动放行
  useEffect(() => {
    if (user && !isForceChange) {
      navigate('/', { replace: true })
    }
  }, [user, isForceChange, navigate])

  if (!user) return null

  const handleSuccess = async () => {
    // 改密成功后，后端会清除 forceChangePassword 标记；
    // 这里同步更新本地 user，解除强制改密状态
    updateUser({ forceChangePassword: 0 })
    navigate('/', { replace: true })
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md'>
        <div className='mb-6 text-center'>
          <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10'>
            <Lock className='h-7 w-7 text-primary' />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('forceChange.title')}
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t('forceChange.description')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <ShieldCheck className='h-5 w-5 text-primary' />
              {t('forceChange.formTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm mode='set' onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
