import { toast } from 'sonner'
import { getPreviewToken } from '@/api/file'
import i18n from '@/i18n'
import type { FileItem } from '@/types/file'

const PREVIEW_NAVIGATION_PREFIX = 'free-fs-preview-navigation:'
const IMAGE_SUFFIXES = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'])
const VIDEO_SUFFIXES = new Set(['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'])

function getPreviewCategory(file: FileItem): 'image' | 'video' | null {
  const suffix = file.suffix?.toLowerCase() || ''
  if (IMAGE_SUFFIXES.has(suffix)) return 'image'
  if (VIDEO_SUFFIXES.has(suffix)) return 'video'
  return null
}

function createNavigationSession(currentFile: FileItem, files: FileItem[]) {
  const category = getPreviewCategory(currentFile)
  if (!category) return null

  const ids = files
    .filter((file) => !file.isDir && getPreviewCategory(file) === category)
    .map((file) => file.id)
  if (ids.length < 2 || !ids.includes(currentFile.id)) return null

  const sessionId = crypto.randomUUID()
  localStorage.setItem(
    `${PREVIEW_NAVIGATION_PREFIX}${sessionId}`,
    JSON.stringify({ ids, createdAt: Date.now() })
  )
  return sessionId
}

/**
 * 通过短时预览令牌打开文件预览页
 */
export async function openFilePreviewWithToken(
  file: FileItem,
  previewBaseUrl: string,
  navigationFiles: FileItem[] = []
) {
  const fileId = file.id
  const navigationSession = createNavigationSession(file, navigationFiles)
  const previewWindow = window.open('', '_blank')

  if (!previewWindow) {
    toast.error(i18n.t('common:preview.popupBlocked'))
    return
  }

  try {
    const token = await getPreviewToken(fileId)
    const navigationParam = navigationSession
      ? `&navSession=${encodeURIComponent(navigationSession)}`
      : ''
    const previewUrl = `${previewBaseUrl}/preview/${fileId}?previewToken=${encodeURIComponent(token)}${navigationParam}`
    previewWindow.location.href = previewUrl
  } catch (error) {
    previewWindow.close()
    toast.error(i18n.t('common:preview.tokenFailed'))
  }
}
