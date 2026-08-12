import { AlertCircle, CheckCircle2, FileArchive, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatFileSize } from '@/utils/format'
import type { FolderDownloadTaskVO } from '@/types/transfer'

export type FolderDownloadPanelTask = FolderDownloadTaskVO & {
  downloadStarted?: boolean
}

interface FolderDownloadPanelProps {
  tasks: FolderDownloadPanelTask[]
  onDismiss: (taskId: string) => void
  onCancel: (taskId: string) => void
}

function isActive(status: FolderDownloadTaskVO['status']) {
  return status === 'queued' || status === 'scanning' || status === 'packing'
}

function getStatusText(task: FolderDownloadPanelTask) {
  if (task.status === 'failed') return task.errorMessage || '打包失败'
  if (task.status === 'canceled') return '打包已取消'
  if (task.status === 'expired') return '下载文件已过期'
  if (task.status === 'downloading') return '正在下载'
  if (task.status === 'completed') {
    return task.downloadStarted ? '已交给浏览器下载' : '打包完成，准备下载'
  }
  return task.message || '正在准备下载'
}

export default function FolderDownloadPanel({
  tasks,
  onDismiss,
  onCancel,
}: FolderDownloadPanelProps) {
  if (tasks.length === 0) return null

  return (
    <div className='fixed right-10 bottom-24 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2'>
      {tasks.map((task) => {
        const progress = Math.max(0, Math.min(100, task.progress || 0))
        const active = isActive(task.status)
        return (
          <div
            key={task.taskId}
            className='rounded-lg border bg-card p-3 shadow-2xl'
          >
            <div className='flex items-start gap-3'>
              <div className='mt-0.5 shrink-0'>
                {active ? (
                  <div className='h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                ) : task.status === 'completed' ||
                  task.status === 'downloading' ? (
                  <CheckCircle2 className='h-5 w-5 text-green-600' />
                ) : (
                  <AlertCircle className='h-5 w-5 text-destructive' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-start gap-2'>
                  <FileArchive className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium'>
                      {task.folderName}
                    </div>
                    <div className='mt-0.5 text-xs text-muted-foreground'>
                      {getStatusText(task)}
                    </div>
                  </div>
                  <X
                    className='h-4 w-4 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground'
                    title={active ? '取消打包' : '关闭'}
                    onClick={() =>
                      active ? onCancel(task.taskId) : onDismiss(task.taskId)
                    }
                  />
                </div>

                <div className='mt-3 space-y-1.5'>
                  <Progress value={progress} className='h-1.5' />
                  <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
                    <span>{progress}%</span>
                    <span>
                      已处理 {task.processedFiles || 0} / {task.totalFiles || 0}{' '}
                      个文件
                    </span>
                  </div>
                  {task.totalBytes > 0 && (
                    <div className='text-xs text-muted-foreground'>
                      {formatFileSize(task.processedBytes || 0)} /{' '}
                      {formatFileSize(task.totalBytes)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
