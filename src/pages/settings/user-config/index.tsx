import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { userApi } from '@/api/user'
import type { UserConfig } from '@/types/user'
import {
  SettingsPageDescription,
  SettingsPageTitle,
} from '../components/settings-page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PASSWORD_MASK = '******'

export function SettingsUserConfig() {
  const { t } = useTranslation('settings')
  const [defaultPassword, setDefaultPassword] = useState('')
  const [forceChange, setForceChange] = useState(false)
  const [passwordConfigured, setPasswordConfigured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const data: UserConfig = await userApi.getUserConfig()
      setPasswordConfigured(!!data.defaultPassword)
      const isConfigured = !!data.defaultPassword
      setDefaultPassword(isConfigured ? PASSWORD_MASK : '')
      setForceChange(data.forceChangePasswordOnFirstLogin === 1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextPassword = defaultPassword.trim()
    // 掩码状态视为未修改密码
    const hasNewPassword = !!nextPassword && nextPassword !== PASSWORD_MASK

    if (hasNewPassword && nextPassword.length < 8) {
      toast.error(t('userConfig.passwordMin'))
      return
    }

    setSaving(true)
    try {
      await userApi.updateUserConfig({
        defaultPassword: hasNewPassword ? nextPassword : undefined,
        forceChangePasswordOnFirstLogin: forceChange ? 1 : 0,
      })
      toast.success(t('userConfig.saved'))
      fetchConfig()
    } catch (err: any) {
      if (!err?.handled) toast.error(t('userConfig.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleClearPassword = () => {
    setDefaultPassword('')
    setPasswordConfigured(false)
  }

  return (
    <div className='flex flex-1 flex-col'>
      <header className='flex-none'>
        <SettingsPageTitle>{t('userConfig.pageTitle')}</SettingsPageTitle>
        <SettingsPageDescription>
          {t('userConfig.pageDescription')}
        </SettingsPageDescription>
      </header>

      <div className='mt-8 flex-1'>
        {loading ? (
          <p className='text-sm text-muted-foreground'>{t('members.loading')}</p>
        ) : (
          <form onSubmit={handleSubmit} className='max-w-lg space-y-6'>
            <Card>
              <CardContent className='space-y-5 pt-6'>
                <div className='space-y-3'>
                  <Label htmlFor='default-password'>
                    <KeyRound className='mr-1 inline h-4 w-4' />
                    {t('userConfig.defaultPassword')}
                  </Label>
                  <Input
                    id='default-password'
                    type='password'
                    value={defaultPassword}
                    onChange={(e) => {
                      setDefaultPassword(e.target.value)
                      // 用户主动修改时清除"已配置"掩码状态
                      if (e.target.value !== PASSWORD_MASK) {
                        setPasswordConfigured(false)
                      }
                    }}
                    placeholder={t('userConfig.defaultPasswordPlaceholder')}
                    disabled={saving}
                  />
                  <p className='text-xs text-muted-foreground'>
                    {passwordConfigured
                      ? t('userConfig.passwordConfigured')
                      : t('userConfig.defaultPasswordHint')}
                  </p>
                  {passwordConfigured && (
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      className='h-auto p-0 text-xs text-destructive'
                      onClick={handleClearPassword}
                    >
                      {t('userConfig.clearPassword')}
                    </Button>
                  )}
                </div>

                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='force-change'
                    checked={forceChange}
                    onCheckedChange={(checked) =>
                      setForceChange(!!checked)
                    }
                    disabled={saving}
                  />
                  <div className='grid gap-1.5 leading-none'>
                    <Label
                      htmlFor='force-change'
                      className='text-sm font-medium leading-none'
                    >
                      {t('userConfig.forceChangeOnFirstLogin')}
                    </Label>
                    <p className='text-xs text-muted-foreground'>
                      {t('userConfig.forceChangeHint')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type='submit' disabled={saving}>
              {saving
                ? t('userConfig.saving')
                : t('userConfig.save')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}