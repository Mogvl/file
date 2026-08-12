import type {
  FileTransferTaskVO,
  FolderDownloadTaskVO,
  InitUploadCmd,
  CheckUploadCmd,
  CheckUploadResultVO,
} from '@/types/transfer'
import { request } from './request'
import service from './request'

const silentUploadRequestConfig = {
  timeout: 0,
  showErrorMessage: false,
} as any

/**
 * 初始化上传
 */
export function initUpload(params: InitUploadCmd) {
  return request.post<string>(
    '/apis/transfer/init',
    params,
    silentUploadRequestConfig
  )
}

/**
 * 校验文件
 */
export function checkUpload(params: CheckUploadCmd) {
  return request.post<CheckUploadResultVO>(
    '/apis/transfer/check',
    params,
    silentUploadRequestConfig
  )
}

/**
 * 上传分片
 */
export function uploadChunk(
  file: Blob,
  taskId: string,
  chunkIndex: number,
  chunkMd5: string,
  signal?: AbortSignal
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('taskId', taskId)
  formData.append('chunkIndex', chunkIndex.toString())
  formData.append('chunkMd5', chunkMd5)

  return request.post('/apis/transfer/chunk', formData, {
    ...silentUploadRequestConfig,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal,
  })
}

/**
 * 查询已上传的分片
 */
export function getUploadedChunks(taskId: string) {
  return request.get<number[]>(
    `/apis/transfer/chunks/${taskId}`,
    silentUploadRequestConfig
  )
}

/**
 * 合并分片
 */
export function mergeChunks(taskId: string) {
  return request.post<string>(`/apis/transfer/merge/${taskId}`)
}

/**
 * 取消上传任务
 */
export function cancelUpload(taskId: string) {
  return request.delete(`/apis/transfer/cancel/${taskId}`)
}

/**
 * 获取传输文件列表
 */
export function getTransferFiles() {
  return request.get<FileTransferTaskVO[]>(
    '/apis/transfer/files',
    silentUploadRequestConfig
  )
}

/**
 * 暂停上传任务
 */
export function pauseUpload(taskId: string) {
  return request.post(`/apis/transfer/pause/${taskId}`)
}

/**
 * 恢复上传任务
 */
export function resumeUpload(taskId: string) {
  return request.post(`/apis/transfer/resume/${taskId}`)
}

/**
 * 清空已完成任务
 */
export function clearCompletedTasks() {
  return request.delete('/apis/transfer/clears')
}

/**
 * 创建文件夹下载打包任务
 */
export function createFolderDownloadTask(folderId: string) {
  return request.post<FolderDownloadTaskVO>(
    `/apis/transfer/folder-download/tasks/${folderId}`,
    null,
    { timeout: 0 }
  )
}

/**
 * 查询文件夹下载打包进度
 */
export function getFolderDownloadTask(taskId: string) {
  return request.get<FolderDownloadTaskVO>(
    `/apis/transfer/folder-download/tasks/${taskId}`,
    silentUploadRequestConfig
  )
}

/**
 * 取消文件夹下载打包任务
 */
export function cancelFolderDownloadTask(taskId: string) {
  return request.delete(
    `/apis/transfer/folder-download/tasks/${taskId}`,
    silentUploadRequestConfig
  )
}

/**
 * 下载文件夹压缩包
 */
export function downloadFolderTaskFile(taskId: string) {
  return service.get<Blob>(
    `/apis/transfer/folder-download/tasks/${taskId}/file`,
    {
      responseType: 'blob',
      timeout: 0,
      showErrorMessage: false,
    } as any
  )
}
