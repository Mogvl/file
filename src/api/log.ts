import type { OperationLogPage, OperationLogQuery } from '@/types/log'
import { request } from './request'

/** 获取当前工作空间的文件及成员操作日志。 */
export function getOperationLogs(params: OperationLogQuery) {
  return request.get<OperationLogPage>('/apis/logs/operation/pages', {
    params,
  })
}
