import { TransferSetting } from '@/types/transfer-setting'
import { UserInfo } from '@/types/user'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userApi } from '@/api/user'

interface UserState {
  id: string
  username: string
  nickname: string
  email: string
  avatar: string
  status: number
  createdAt: string
  updatedAt: string
  lastLoginAt: string
  isSetPassword?: boolean
  /** 首次登录是否强制修改密码（不持久化，仅从 AuthContext 读取） */
  forceChangePassword?: number
  transferSetting?: TransferSetting
  setUserInfo: (userInfo: UserInfo) => void
  setTransferSetting: (setting: TransferSetting) => void
  loadTransferSetting: () => Promise<void>
  clearUserInfo: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: '',
      username: '',
      nickname: '',
      email: '',
      avatar: '',
      status: 0,
      createdAt: '',
      updatedAt: '',
      lastLoginAt: '',
      isSetPassword: undefined,
      forceChangePassword: undefined,
      transferSetting: undefined,
      setUserInfo: (userInfo) =>
        set({
          id: userInfo.id,
          username: userInfo.username,
          nickname: userInfo.nickname,
          email: userInfo.email,
          avatar: userInfo.avatar,
          status: userInfo.status,
          createdAt: userInfo.createdAt,
          updatedAt: userInfo.updatedAt,
          lastLoginAt: userInfo.lastLoginAt,
          isSetPassword: userInfo.isSetPassword,
          forceChangePassword: userInfo.forceChangePassword,
        }),
      setTransferSetting: (setting) => set({ transferSetting: setting }),
      loadTransferSetting: async () => {
        try {
          const setting = await userApi.getTransferSetting()
          set({ transferSetting: setting })
        } catch (error) {
          set({
            transferSetting: {
              userId: '',
              downloadLocation: '',
              isDefaultDownloadLocation: 1,
              downloadSpeedLimit: 0,
              concurrentUploadQuantity: 3,
              concurrentDownloadQuantity: 3,
              chunkSize: 5 * 1024 * 1024,
            },
          })
        }
      },
      clearUserInfo: () =>
        set({
          id: '',
          username: '',
          nickname: '',
          email: '',
          avatar: '',
          status: 0,
          createdAt: '',
          updatedAt: '',
          lastLoginAt: '',
          isSetPassword: undefined,
          forceChangePassword: undefined,
          transferSetting: undefined,
        }),
    }),
    {
      name: 'user-storage',
    }
  )
)
