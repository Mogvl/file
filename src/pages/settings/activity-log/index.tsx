import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getOperationLogs } from '@/api/log'
import type {
  OperationLogItem,
  OperationLogStatus,
} from '@/types/log'
import { formatOperationLogDetail } from '@/utils/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  SettingsPageDescription,
  SettingsPageTitle,
} from '../components/settings-page-header'

const PAGE_SIZE = 20

const OPERATION_TYPES = [
  'UPLOAD',
  'DOWNLOAD',
  'CREATE_FOLDER',
  'COPY',
  'MOVE',
  'RENAME',
  'DELETE',
  'RESTORE',
  'PERMANENT_DELETE',
  'CLEAR_RECYCLE',
  'CREATE_SHARE',
  'CANCEL_SHARE',
  'CREATE_COLLECTION',
  'UPDATE_COLLECTION',
  'DELETE_COLLECTION',
  'COLLECTION_UPLOAD',
  'CREATE_WORKSPACE',
  'UPDATE_WORKSPACE',
  'DELETE_WORKSPACE',
  'UPDATE_MEMBER_ROLE',
  'REMOVE_MEMBER',
  'CREATE_INVITATION',
  'CANCEL_INVITATION',
  'CREATE_ROLE',
  'UPDATE_ROLE',
  'DELETE_ROLE',
  'ADD_STORAGE',
  'UPDATE_STORAGE',
  'SWITCH_STORAGE',
  'DELETE_STORAGE',
] as const

function displayValue(value?: string | null) {
  return value?.trim() || '—'
}

function isHandledError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'handled' in error &&
    error.handled === true
  )
}

export function SettingsLogs() {
  const { t } = useTranslation('settings')
  const [logs, setLogs] = useState<OperationLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [operationType, setOperationType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getOperationLogs({
        page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        operationType:
          operationType === 'ALL' ? undefined : operationType,
        status:
          status === 'ALL' ? undefined : (Number(status) as OperationLogStatus),
      })
      setLogs(result?.records ?? [])
      setTotal(result?.total ?? 0)
    } catch (error: unknown) {
      if (!isHandledError(error)) toast.error(t('logs.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [keyword, operationType, page, status, t])

  useEffect(() => {
    // 筛选条件变化后需要主动请求服务端数据。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs()
  }, [fetchLogs])

  const operationLabel = useMemo(
    () => (type: string, fallback?: string) => {
      const key = `logs.operationTypes.${type}`
      const translated = t(key)
      return translated === key ? displayValue(fallback) : translated
    },
    [t]
  )

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className='flex flex-1 flex-col'>
      <header className='flex-none'>
        <SettingsPageTitle>{t('logs.pageTitle')}</SettingsPageTitle>
        <SettingsPageDescription>
          {t('logs.pageDescription')}
        </SettingsPageDescription>
      </header>

      <div className='mt-6 flex flex-1 flex-col'>
        <form
          onSubmit={handleSearch}
          className='mb-4 flex flex-wrap items-center gap-2'
        >
          <div className='relative min-w-[180px] flex-1 sm:max-w-[340px]'>
            <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder={t('logs.searchPlaceholder')}
              className='pl-9'
            />
          </div>
          <Select
            value={operationType}
            onValueChange={(value) =>
              handleFilterChange(setOperationType, value)
            }
          >
            <SelectTrigger className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('logs.allOperations')}</SelectItem>
              {OPERATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {operationLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => handleFilterChange(setStatus, value)}
          >
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('logs.allStatuses')}</SelectItem>
              <SelectItem value='0'>{t('logs.success')}</SelectItem>
              <SelectItem value='1'>{t('logs.failure')}</SelectItem>
            </SelectContent>
          </Select>
          <Button type='submit' size='sm'>
            <Search className='mr-1.5 size-4' />
            {t('logs.search')}
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => void fetchLogs()}
            disabled={loading}
            aria-label={t('logs.refresh')}
          >
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </form>

        <div className='rounded-md border'>
          <Table containerClassName='overflow-visible'>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[150px]'>{t('logs.colTime')}</TableHead>
                <TableHead className='w-[120px]'>{t('logs.colOperator')}</TableHead>
                <TableHead className='w-[150px]'>{t('logs.colOperation')}</TableHead>
                <TableHead>{t('logs.colTarget')}</TableHead>
                <TableHead className='w-[130px]'>{t('logs.colIp')}</TableHead>
                <TableHead>{t('logs.colDetail')}</TableHead>
                <TableHead className='w-[80px]'>{t('logs.colStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='py-10 text-center text-muted-foreground'>
                    {t('logs.loading')}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='py-10 text-center text-muted-foreground'>
                    {t('logs.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className='whitespace-nowrap text-xs text-muted-foreground'>
                      {log.operationTime
                        ? dayjs(log.operationTime).format('YYYY-MM-DD HH:mm:ss')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className='max-w-[110px] truncate text-sm' title={displayValue(log.operatorName || log.operatorId)}>
                        {displayValue(log.operatorName || log.operatorId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='max-w-[140px] truncate text-sm' title={operationLabel(log.operationType, log.operationName)}>
                        {operationLabel(log.operationType, log.operationName)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='truncate text-sm' title={displayValue(log.targetName || log.targetId)}>
                        {displayValue(log.targetName || log.targetId)}
                      </div>
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {displayValue(log.operationIp)}
                    </TableCell>
                    <TableCell>
                      <div className='truncate text-xs text-muted-foreground' title={formatOperationLogDetail(log.detail || log.errorMessage)}>
                        {displayValue(formatOperationLogDetail(log.detail || log.errorMessage))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === 0 ? 'secondary' : 'destructive'}>
                        {log.status === 0 ? t('logs.success') : t('logs.failure')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className='mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground'>
          <span>{t('logs.total', { count: total })}</span>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='size-8'
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className='size-4' />
            </Button>
            <span>{t('logs.pageOf', { page, total: totalPages })}</span>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='size-8'
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
