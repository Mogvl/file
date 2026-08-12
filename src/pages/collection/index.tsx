import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  FileUp,
  Inbox,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  checkFileCollectionUpload,
  completeFileCollectionSubmission,
  getFileCollectionUploadedChunks,
  getPublicFileCollection,
  initFileCollectionUpload,
  mergeFileCollectionUpload,
  startFileCollectionSubmission,
  uploadFileCollectionChunk,
} from '@/api/collection'
import type {
  FileCollectionPublic,
  FileCollectionSubmissionSession,
} from '@/types/collection'
import { calculateBlobMD5, calculateFileMD5 } from '@/utils/md5'
import { formatFileSize } from '@/utils/format'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

type UploadStatus = 'ready' | 'preparing' | 'hashing' | 'uploading' | 'merging' | 'done' | 'failed'

interface UploadEntry {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
}

const CHUNK_SIZE = 5 * 1024 * 1024
const CHUNK_CONCURRENCY = 3
const CHUNK_RETRIES = 3

export default function FileCollectionPublicPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const { t } = useTranslation('collection')
  const [collection, setCollection] = useState<FileCollectionPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submitterName, setSubmitterName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const sessionRef = useRef<FileCollectionSubmissionSession | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCollection = useCallback(async () => {
    if (!collectionId) return
    setLoading(true)
    setLoadError(false)
    try {
      setCollection(await getPublicFileCollection(collectionId))
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [collectionId])

  useEffect(() => {
    void loadCollection()
  }, [loadCollection])

  const allowedExtensions = useMemo(
    () =>
      new Set(
        (collection?.allowedExtensions || '')
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      ),
    [collection?.allowedExtensions]
  )

  const accept = useMemo(
    () =>
      allowedExtensions.size > 0
        ? [...allowedExtensions].map((extension) => `.${extension}`).join(',')
        : undefined,
    [allowedExtensions]
  )

  const updateEntry = (id: string, patch: Partial<UploadEntry>) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    )
  }

  const addFiles = (fileList: FileList | File[]) => {
    if (!collection || uploading) return
    const incoming = Array.from(fileList)
    if (entries.length + incoming.length > 1000) {
      toast.error(t('public.tooManyFiles'))
      return
    }

    const existingKeys = new Set(
      entries.map((entry) => `${entry.file.name}:${entry.file.size}:${entry.file.lastModified}`)
    )
    const next: UploadEntry[] = []
    for (const file of incoming) {
      if (file.size > collection.maxFileSize) {
        toast.error(t('public.fileTooLarge', { name: file.name }))
        continue
      }
      const extension = file.name.includes('.')
        ? file.name.split('.').pop()?.toLowerCase() || ''
        : ''
      if (allowedExtensions.size > 0 && !allowedExtensions.has(extension)) {
        toast.error(t('public.typeNotAllowed', { name: file.name }))
        continue
      }
      const key = `${file.name}:${file.size}:${file.lastModified}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      next.push({
        id: `${crypto.randomUUID?.() || Date.now()}-${next.length}`,
        file,
        status: 'ready',
        progress: 0,
      })
    }
    setEntries((current) => [...current, ...next])
  }

  const uploadChunkWithRetry = async (
    session: FileCollectionSubmissionSession,
    taskId: string,
    file: File,
    chunkIndex: number
  ) => {
    const start = chunkIndex * CHUNK_SIZE
    const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size))
    const chunkMd5 = await calculateBlobMD5(chunk)
    let lastError: unknown
    for (let attempt = 0; attempt < CHUNK_RETRIES; attempt += 1) {
      try {
        await uploadFileCollectionChunk(
          collectionId!,
          session.submissionId,
          session.uploadToken,
          taskId,
          chunkIndex,
          chunkMd5,
          chunk
        )
        return
      } catch (error) {
        lastError = error
        if (attempt < CHUNK_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)))
        }
      }
    }
    throw lastError
  }

  const uploadOne = async (
    entry: UploadEntry,
    session: FileCollectionSubmissionSession
  ) => {
    const { file } = entry
    updateEntry(entry.id, { status: 'preparing', progress: 2, error: undefined })
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const taskId = await initFileCollectionUpload(
      collectionId!,
      session.submissionId,
      session.uploadToken,
      {
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        chunkSize: CHUNK_SIZE,
        mimeType: file.type || 'application/octet-stream',
      }
    )

    updateEntry(entry.id, { status: 'hashing', progress: 5 })
    const fileMd5 = await calculateFileMD5(file)
    const check = await checkFileCollectionUpload(
      collectionId!,
      session.submissionId,
      session.uploadToken,
      taskId,
      fileMd5,
      file.name
    )
    if (check.isQuickUpload) {
      updateEntry(entry.id, { status: 'done', progress: 100 })
      return
    }

    const uploaded = new Set(
      await getFileCollectionUploadedChunks(
        collectionId!,
        session.submissionId,
        session.uploadToken,
        taskId
      )
    )
    let uploadedCount = uploaded.size
    const pending = Array.from({ length: totalChunks }, (_, index) => index).filter(
      (index) => !uploaded.has(index)
    )
    let cursor = 0
    updateEntry(entry.id, {
      status: 'uploading',
      progress: totalChunks === 0 ? 90 : 10 + (uploadedCount / totalChunks) * 80,
    })

    const worker = async () => {
      while (cursor < pending.length) {
        const current = cursor
        cursor += 1
        const chunkIndex = pending[current]
        await uploadChunkWithRetry(session, taskId, file, chunkIndex)
        uploadedCount += 1
        updateEntry(entry.id, {
          status: 'uploading',
          progress: 10 + (uploadedCount / totalChunks) * 80,
        })
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CHUNK_CONCURRENCY, pending.length) }, () => worker())
    )

    updateEntry(entry.id, { status: 'merging', progress: 95 })
    await mergeFileCollectionUpload(
      collectionId!,
      session.submissionId,
      session.uploadToken,
      taskId
    )
    updateEntry(entry.id, { status: 'done', progress: 100 })
  }

  const handleUpload = async () => {
    if (!collection || !collectionId) return
    if (!submitterName.trim()) {
      toast.warning(t('public.nameRequired'))
      return
    }
    if (collection.hasAccessCode && !accessCode.trim()) {
      toast.warning(t('public.codeRequired'))
      return
    }
    if (entries.length === 0) {
      toast.warning(t('public.filesRequired'))
      return
    }

    setUploading(true)
    let failed = false
    try {
      let session = sessionRef.current
      if (!session) {
        try {
          session = await startFileCollectionSubmission(
            collectionId,
            submitterName.trim(),
            accessCode.trim() || undefined
          )
          sessionRef.current = session
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : t('public.sessionFailed')
          )
          return
        }
      }

      const pendingEntries = entries.filter((entry) => entry.status !== 'done')
      for (const entry of pendingEntries) {
        try {
          await uploadOne(entry, session)
        } catch (error) {
          failed = true
          updateEntry(entry.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : t('public.failed'),
          })
        }
      }

      if (!failed) {
        await completeFileCollectionSubmission(
          collectionId,
          session.submissionId,
          session.uploadToken
        )
        setSuccess(true)
        sessionRef.current = null
      } else {
        toast.error(t('public.someFailed'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('public.someFailed'))
    } finally {
      setUploading(false)
    }
  }

  const resetSubmission = () => {
    setEntries([])
    setSuccess(false)
    setSubmitterName('')
    setAccessCode('')
    sessionRef.current = null
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-muted/30'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    )
  }

  if (loadError || !collection) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-muted/30 p-6'>
        <Card className='w-full max-w-lg text-center'>
          <CardContent className='space-y-4 py-12'>
            <XCircle className='mx-auto size-12 text-destructive' />
            <p className='text-lg font-medium'>{t('public.notFound')}</p>
            <Button variant='outline' onClick={() => void loadCollection()}>{t('public.retry')}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const unavailable = collection.status !== 'OPEN' || collection.expired

  return (
    <div className='min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/40 px-4 py-8 sm:py-14'>
      <div className='mx-auto w-full max-w-2xl space-y-5'>
        <div className='text-center'>
          <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
            <Inbox className='size-6' />
          </div>
          <p className='text-sm text-muted-foreground'>{t('public.poweredBy')}</p>
        </div>

        <Card className='shadow-lg shadow-primary/5'>
          <CardHeader className='text-center'>
            <div className='relative'>
              <CardTitle className='break-words px-10 text-2xl'>
                {collection.collectionName}
              </CardTitle>
              <ShieldCheck className='absolute right-0 top-1/2 size-6 -translate-y-1/2 text-emerald-600' />
            </div>
            {collection.description && (
              <p className='mx-auto mt-2 max-w-xl whitespace-pre-wrap text-sm text-muted-foreground'>
                {collection.description}
              </p>
            )}
          </CardHeader>
          <CardContent className='space-y-5'>
            {unavailable ? (
              <Alert variant='destructive'>
                <XCircle className='size-4' />
                <AlertTitle>
                  {collection.expired ? t('public.expired') : t('public.closed')}
                </AlertTitle>
              </Alert>
            ) : success ? (
              <div className='space-y-5 py-8 text-center'>
                <CheckCircle2 className='mx-auto size-16 text-emerald-600' />
                <div>
                  <h2 className='text-xl font-semibold'>{t('public.successTitle')}</h2>
                  <p className='mt-2 text-muted-foreground'>{t('public.successDescription')}</p>
                </div>
                <Button variant='outline' onClick={resetSubmission}>{t('public.submitMore')}</Button>
              </div>
            ) : (
              <>
                <div className='space-y-4'>
                  <div className='flex w-full items-center gap-3'>
                    <Label
                      htmlFor='submitter-name'
                      className='shrink-0 whitespace-nowrap'
                    >
                      {t('public.submitterName')}
                    </Label>
                    <Input
                      id='submitter-name'
                      value={submitterName}
                      disabled={uploading || Boolean(sessionRef.current)}
                      className='min-w-0 flex-1'
                      maxLength={64}
                      placeholder={t('public.submitterPlaceholder')}
                      onChange={(event) => setSubmitterName(event.target.value)}
                    />
                  </div>
                  {collection.hasAccessCode && (
                    <div className='flex w-full items-center gap-3'>
                      <Label
                        htmlFor='collection-access-code'
                        className='shrink-0 whitespace-nowrap'
                      >
                        {t('public.accessCode')}
                      </Label>
                      <div className='relative min-w-0 flex-1'>
                        <Lock className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                        <Input
                          id='collection-access-code'
                          value={accessCode}
                          disabled={uploading || Boolean(sessionRef.current)}
                          className='pl-9'
                          maxLength={32}
                          placeholder={t('public.accessCodePlaceholder')}
                          onChange={(event) => setAccessCode(event.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept={accept}
                  className='hidden'
                  onChange={(event) => event.target.files && addFiles(event.target.files)}
                />
                <button
                  type='button'
                  disabled={uploading}
                  className='flex w-full flex-col items-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60'
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    addFiles(event.dataTransfer.files)
                  }}
                >
                  <FileUp className='mb-3 size-10 text-primary' />
                  <span className='font-medium'>{t('public.chooseFiles')}</span>
                  <span className='mt-1 text-sm text-muted-foreground'>{t('public.dropHint')}</span>
                </button>

                <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                  <Badge variant='secondary'>
                    {t('public.maxSize', { size: formatFileSize(collection.maxFileSize) })}
                  </Badge>
                  <Badge variant='secondary'>
                    {allowedExtensions.size > 0
                      ? t('public.allowedTypes', { types: [...allowedExtensions].join(', ') })
                      : t('public.allTypes')}
                  </Badge>
                </div>

                {entries.length > 0 && (
                  <div className='space-y-3'>
                    <p className='text-sm font-medium'>{t('public.selected', { count: entries.length })}</p>
                    <div className='max-h-72 space-y-2 overflow-y-auto pr-1'>
                      {entries.map((entry) => (
                        <div key={entry.id} className='rounded-lg border p-3'>
                          <div className='flex items-start gap-3'>
                            <FileUp className='mt-0.5 size-5 shrink-0 text-muted-foreground' />
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center justify-between gap-2'>
                                <span className='truncate text-sm font-medium'>{entry.file.name}</span>
                                <span className='shrink-0 text-xs text-muted-foreground'>{formatFileSize(entry.file.size)}</span>
                              </div>
                              <div className='mt-2 flex items-center gap-2'>
                                <Progress value={entry.progress} className='h-1.5 flex-1' />
                                <span className='w-16 text-right text-xs text-muted-foreground'>
                                  {t(`public.${entry.status}`)}
                                </span>
                              </div>
                              {entry.error && <p className='mt-1 text-xs text-destructive'>{entry.error}</p>}
                            </div>
                            {!uploading && entry.status !== 'done' && (
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='size-8 shrink-0'
                                onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}
                              >
                                <Trash2 className='size-4' />
                                <span className='sr-only'>{t('public.remove')}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button className='w-full' size='lg' disabled={uploading} onClick={() => void handleUpload()}>
                  {uploading ? (
                    <><Loader2 className='mr-2 size-4 animate-spin' />{t('public.uploading')}</>
                  ) : (
                    <><FileUp className='mr-2 size-4' />{t('public.upload')}</>
                  )}
                </Button>
                <Alert>
                  <ShieldCheck className='size-4' />
                  <AlertDescription>{t('public.dropHint')}</AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
