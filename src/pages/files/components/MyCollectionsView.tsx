import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  Copy,
  ExternalLink,
  Inbox,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  deleteFileCollection,
  getFileCollectionPage,
  getFileCollectionSubmissions,
  updateFileCollectionStatus,
} from '@/api/collection'
import type {
  FileCollection,
  FileCollectionStatus,
  FileCollectionSubmission,
} from '@/types/collection'
import { copyTextToClipboard } from '@/utils/copy-to-clipboard'
import { formatFileSize } from '@/utils/format'
import { usePermission } from '@/hooks/use-permission'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function MyCollectionsView() {
  const { t } = useTranslation('collection')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { hasPermission } = usePermission()
  const canShare = hasPermission('file:share')
  const canWrite = hasPermission('file:write')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'ALL' | FileCollectionStatus>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<FileCollection[]>([])

  const [recordsOpen, setRecordsOpen] = useState(false)
  const [activeCollection, setActiveCollection] = useState<FileCollection | null>(null)
  const [records, setRecords] = useState<FileCollectionSubmission[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsPage, setRecordsPage] = useState(1)
  const [recordsTotal, setRecordsTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCollection, setDeletingCollection] =
    useState<FileCollection | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCollections = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getFileCollectionPage({
        keyword: keyword || undefined,
        status: status === 'ALL' ? undefined : status,
        page,
        pageSize,
        orderBy: 'createdAt',
        orderDirection: 'DESC',
      })
      setCollections(result.records)
      setTotal(Number(result.total || 0))
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize, status])

  useEffect(() => {
    // The fetch updates loading/data state after synchronizing with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCollections()
  }, [fetchCollections])

  const fetchRecords = useCallback(async () => {
    if (!activeCollection) return
    setRecordsLoading(true)
    try {
      const result = await getFileCollectionSubmissions(activeCollection.id, {
        page: recordsPage,
        pageSize: 10,
      })
      setRecords(result.records)
      setRecordsTotal(Number(result.total || 0))
    } finally {
      setRecordsLoading(false)
    }
  }, [activeCollection, recordsPage])

  useEffect(() => {
    if (recordsOpen) {
      // The fetch updates loading/data state after synchronizing with the API.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchRecords()
    }
  }, [recordsOpen, fetchRecords])

  const collectionUrl = (collection: FileCollection) =>
    `${window.location.origin}/collect/${collection.id}`

  const handleCopyLink = async (collection: FileCollection) => {
    await copyTextToClipboard(collectionUrl(collection))
    toast.success(t('manager.copied'))
  }

  const handleStatus = async (collection: FileCollection) => {
    const nextStatus: FileCollectionStatus =
      collection.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    if (nextStatus === 'OPEN' && !canWrite) return
    await updateFileCollectionStatus(collection.id, nextStatus)
    toast.success(t('manager.statusUpdated'))
    void fetchCollections()
  }

  const requestDelete = (collection: FileCollection) => {
    setDeletingCollection(collection)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingCollection || deleting) return

    const collection = deletingCollection
    setDeleting(true)
    try {
      await deleteFileCollection(collection.id)
      toast.success(t('manager.deleted'))
      setDeleteDialogOpen(false)
      setDeletingCollection(null)

      if (activeCollection?.id === collection.id) {
        setRecordsOpen(false)
        setActiveCollection(null)
      }

      const shouldGoToPreviousPage = collections.length === 1 && page > 1
      setCollections((current) =>
        current.filter((item) => item.id !== collection.id)
      )
      setTotal((current) => Math.max(0, current - 1))

      if (shouldGoToPreviousPage) {
        setPage((current) => Math.max(1, current - 1))
      } else {
        void fetchCollections()
      }
    } catch (error: unknown) {
      const handled =
        typeof error === 'object' &&
        error !== null &&
        'handled' in error &&
        error.handled === true
      if (!handled) toast.error(t('manager.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const openRecords = (collection: FileCollection) => {
    setActiveCollection(collection)
    setRecords([])
    setRecordsPage(1)
    setRecordsOpen(true)
  }

  const effectiveStatus = (collection: FileCollection) => {
    if (collection.expired) return 'expired'
    return collection.status === 'OPEN' ? 'open' : 'closed'
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const recordPages = Math.max(1, Math.ceil(recordsTotal / 10))

  return (
    <div className='flex h-full flex-col'>
      <div className='flex flex-wrap items-center gap-3 border-b px-6 py-4'>
        <SidebarTrigger className='md:hidden' />
        <div className='min-w-0 flex-1'>
          <h1 className='text-lg font-semibold'>{t('manager.title')}</h1>
          <p className='text-sm text-muted-foreground'>{t('manager.subtitle')}</p>
        </div>
        <div className='flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-initial'>
          <div className='relative w-full sm:w-60'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={keywordInput}
              className='pl-9'
              placeholder={t('manager.searchPlaceholder')}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(1)
                  setKeyword(keywordInput.trim())
                }
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setPage(1)
              setStatus(value as typeof status)
            }}
          >
            <SelectTrigger className='w-32'><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('manager.allStatus')}</SelectItem>
              <SelectItem value='OPEN'>{t('manager.open')}</SelectItem>
              <SelectItem value='CLOSED'>{t('manager.closed')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='icon' onClick={() => void fetchCollections()}>
            <RefreshCw className='size-4' />
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-6'>
        {loading ? (
          <div className='flex h-full items-center justify-center text-muted-foreground'>
            {tc('loading')}
          </div>
        ) : collections.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'><Inbox className='size-8' /></EmptyMedia>
                <EmptyTitle>{t('manager.empty')}</EmptyTitle>
                <EmptyDescription>{t('manager.emptyHint')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className='overflow-hidden rounded-xl border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('manager.name')}</TableHead>
                  <TableHead>{t('manager.target')}</TableHead>
                  <TableHead>{t('manager.expire')}</TableHead>
                  <TableHead className='text-center'>{t('manager.submissions')}</TableHead>
                  <TableHead className='text-center'>{t('manager.files')}</TableHead>
                  <TableHead>{t('manager.size')}</TableHead>
                  <TableHead className='w-16 text-right'>{t('manager.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => {
                  const state = effectiveStatus(collection)
                  return (
                    <TableRow key={collection.id}>
                      <TableCell>
                        <div className='max-w-64'>
                          <div className='truncate font-medium'>{collection.collectionName}</div>
                          <Badge
                            variant={state === 'open' ? 'default' : 'secondary'}
                            className='mt-1'
                          >
                            {t(`manager.${state}`)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className='max-w-48 truncate'>{collection.targetFolderName}</TableCell>
                      <TableCell>
                        {collection.expireTime
                          ? dayjs(collection.expireTime).format('YYYY-MM-DD HH:mm')
                          : t('manager.permanent')}
                      </TableCell>
                      <TableCell className='text-center'>{collection.submissionCount}</TableCell>
                      <TableCell className='text-center'>{collection.fileCount}</TableCell>
                      <TableCell>{formatFileSize(collection.totalSize || 0)}</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'><MoreHorizontal className='size-4' /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => void handleCopyLink(collection)}>
                              <Copy className='size-4' />{t('manager.copyLink')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRecords(collection)}>
                              <Inbox className='size-4' />{t('manager.records')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={collection.status === 'CLOSED' && !canWrite}
                              onClick={() => void handleStatus(collection)}
                            >
                              <RefreshCw className='size-4' />
                              {collection.status === 'OPEN' ? t('manager.close') : t('manager.reopen')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canShare || !canWrite}
                              className='text-destructive focus:text-destructive'
                              onClick={() => requestDelete(collection)}
                            >
                              <Trash2 className='size-4' />
                              {t('manager.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {collections.length > 0 && (
        <div className='flex items-center justify-end gap-3 border-t px-6 py-3'>
          <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            {t('manager.previous')}
          </Button>
          <span className='text-sm text-muted-foreground'>{t('manager.page', { page })}</span>
          <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>
            {t('manager.next')}
          </Button>
        </div>
      )}

      <Dialog open={recordsOpen} onOpenChange={setRecordsOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>
              {t('manager.records')} · {activeCollection?.collectionName}
            </DialogTitle>
          </DialogHeader>
          {recordsLoading ? (
            <div className='py-12 text-center text-muted-foreground'>{tc('loading')}</div>
          ) : records.length === 0 ? (
            <div className='py-12 text-center text-muted-foreground'>{t('manager.noRecords')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('manager.submitter')}</TableHead>
                  <TableHead>{t('manager.submittedAt')}</TableHead>
                  <TableHead>{t('manager.completedAt')}</TableHead>
                  <TableHead>{t('manager.files')}</TableHead>
                  <TableHead>{t('manager.size')}</TableHead>
                  <TableHead>{t('manager.ip')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className='font-medium'>{record.submitterName}</div>
                      <Badge variant='secondary'>
                        {record.status === 'COMPLETED' ? t('manager.completed') : t('manager.uploading')}
                      </Badge>
                    </TableCell>
                    <TableCell>{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                    <TableCell>{record.completedAt ? dayjs(record.completedAt).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                    <TableCell>{record.fileCount}</TableCell>
                    <TableCell>{formatFileSize(record.totalSize || 0)}</TableCell>
                    <TableCell>{record.submitterIp || '-'}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setRecordsOpen(false)
                          navigate(`/w/${slug}/files?parentId=${record.folderId}`)
                        }}
                      >
                        <ExternalLink className='mr-2 size-4' />
                        {t('manager.openFolder')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {recordsTotal > 0 && (
            <div className='flex items-center justify-end gap-3 pt-3'>
              <Button variant='outline' size='sm' disabled={recordsPage <= 1} onClick={() => setRecordsPage((v) => v - 1)}>
                {t('manager.previous')}
              </Button>
              <span className='text-sm text-muted-foreground'>{t('manager.page', { page: recordsPage })}</span>
              <Button variant='outline' size='sm' disabled={recordsPage >= recordPages} onClick={() => setRecordsPage((v) => v + 1)}>
                {t('manager.next')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open && !deleting) setDeletingCollection(null)
        }}
        title={t('manager.deleteTitle')}
        desc={t('manager.deleteDescription', {
          name: deletingCollection?.collectionName ?? '',
        })}
        cancelBtnText={tc('cancel')}
        confirmText={deleting ? t('manager.deleting') : t('manager.delete')}
        destructive
        isLoading={deleting}
        handleConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
