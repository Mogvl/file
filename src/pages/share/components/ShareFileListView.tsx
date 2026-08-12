import type { FileItem, SortOrder } from '@/types/file'
import { Eye, Download, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatFileSize, formatFileTime } from '@/utils/format'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileIcon } from '@/components/file-icon'

interface ShareFileListViewProps {
  fileList: FileItem[]
  scope?: string
  onFileClick: (file: FileItem) => void
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  orderBy: string
  orderDirection: SortOrder
  onSortChange: (field: string, direction: SortOrder) => void
}

export function ShareFileListView({
  fileList,
  scope,
  onFileClick,
  onPreview,
  onDownload,
  orderBy,
  orderDirection,
  onSortChange,
}: ShareFileListViewProps) {
  const { t } = useTranslation('share')
  const hasPreviewPermission = () => scope?.includes('preview') ?? true
  const hasDownloadPermission = () => scope?.includes('download') ?? true

  const handleDoubleClick = (file: FileItem) => {
    if (file.isDir) {
      onFileClick(file)
    }
  }

  const handleHeaderSort = (field: string) => {
    const nextDirection: SortOrder =
      orderBy === field
        ? orderDirection === 'ASC'
          ? 'DESC'
          : 'ASC'
        : field === 'displayName' || field === 'suffix'
          ? 'ASC'
          : 'DESC'
    onSortChange(field, nextDirection)
  }

  const renderSortIcon = (field: string) => {
    if (orderBy !== field) {
      return <ChevronsUpDown className='size-3.5 opacity-50' />
    }
    return orderDirection === 'ASC' ? (
      <ArrowUp className='size-3.5' />
    ) : (
      <ArrowDown className='size-3.5' />
    )
  }

  return (
    <div className='flex-1 overflow-auto'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50'>
            <TableHead className='font-medium text-muted-foreground'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='-ml-3 h-8 gap-1.5 px-3'
                onClick={() => handleHeaderSort('displayName')}
              >
                {t('fileList.name')}
                {renderSortIcon('displayName')}
              </Button>
            </TableHead>
            <TableHead className='w-28 font-medium text-muted-foreground'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='-ml-3 h-8 gap-1.5 px-3'
                onClick={() => handleHeaderSort('suffix')}
              >
                {t('fileList.type')}
                {renderSortIcon('suffix')}
              </Button>
            </TableHead>
            <TableHead className='w-32 font-medium text-muted-foreground'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='-ml-3 h-8 gap-1.5 px-3'
                onClick={() => handleHeaderSort('size')}
              >
                {t('fileList.size')}
                {renderSortIcon('size')}
              </Button>
            </TableHead>
            <TableHead className='w-48 font-medium text-muted-foreground'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='-ml-3 h-8 gap-1.5 px-3'
                onClick={() => handleHeaderSort('updateTime')}
              >
                {t('fileList.modified')}
                {renderSortIcon('updateTime')}
              </Button>
            </TableHead>
            <TableHead className='w-40 text-center font-medium text-muted-foreground'>
              {t('fileList.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fileList.map((file) => (
            <TableRow
              key={file.id}
              className={cn(
                'group transition-colors',
                file.isDir && 'cursor-pointer'
              )}
              onDoubleClick={() => handleDoubleClick(file)}
            >
              <TableCell>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded'>
                    <FileIcon
                      type={file.isDir ? 'dir' : file.suffix || ''}
                      size={28}
                      className='shrink-0'
                    />
                  </div>
                  <span className='truncate text-sm font-normal text-foreground/90'>
                    {file.displayName}
                  </span>
                </div>
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {file.isDir
                  ? t('fileList.folderType')
                  : file.suffix?.toUpperCase() || t('fileList.unknownType')}
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {file.isDir ? '-' : formatFileSize(file.size)}
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {formatFileTime(file.updateTime)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className='flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                  {!file.isDir && hasPreviewPermission() && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreview(file)
                      }}
                      title={t('fileList.preview')}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                  )}
                  {hasDownloadPermission() && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownload(file)
                      }}
                      title={t('fileList.download')}
                    >
                      <Download className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
