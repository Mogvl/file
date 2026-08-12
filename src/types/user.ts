import type { PermissionCodeType } from './permission'

/** 用户在某个工作空间内的角色与权限 */
export interface UserRolePermissions {
  roleCode: string
  roleName: string
  permissions: PermissionCodeType[]
}

/** 与 GET/PUT `/apis/user/info` 返回的 `data` 对象一致（全局信息，不含权限） */
export interface UserInfo {
  id: string
  username: string
  nickname: string
  email: string
  avatar: string
  status: number
  createdAt: string
  updatedAt: string
  lastLoginAt: string
  /** 是否已设置登录密码（邮箱验证码注册未设密码时为 false） */
  isSetPassword?: boolean
  /** 首次登录是否强制修改密码 0-否 1-是 */
  forceChangePassword?: number
}

export interface LoginRes {
  id: string
  username: string
  /** 首次登录是否强制修改密码 */
  needChangePassword?: boolean
}

/** 与登录接口一致:password 账号/邮箱+密码;email_code 邮箱+验证码(验证码走 password 字段) */
export type LoginType = 'password' | 'email_code'

export interface LoginParams {
  loginType: LoginType
  account: string
  password: string
  isRemember?: boolean
}

export interface UserRegisterParams {
  username: string
  password: string
  confirmPassword: string
  email: string
  nickname: string
  avatar?: string
  inviteToken?: string
}

/** 管理员创建用户 */
export interface UserCreateByAdminParams {
  username: string
  nickname: string
  email: string
  /** 初始密码，为空时使用管理员配置的默认初始密码 */
  password?: string
  roleId: number
}

/** 批量创建用户单条 */
export interface UserBatchItem {
  username: string
  nickname: string
  email?: string
  password?: string
}

/** 批量创建用户请求 */
export interface UserBatchCreateParams {
  users: UserBatchItem[]
  roleId: number
}

/** 用户管理配置 */
export interface UserConfig {
  /** 默认初始密码（已配置时掩码回显） */
  defaultPassword?: string | null
  /** 新建用户首次登录是否强制改密 0-否 1-是 */
  forceChangePasswordOnFirstLogin: number
}

/** 更新用户管理配置 */
export interface UserConfigUpdateParams {
  /** 默认初始密码，留空/掩码表示不修改 */
  defaultPassword?: string
  /** 强制改密开关 0-否 1-是 */
  forceChangePasswordOnFirstLogin?: number
}

export interface ForgotPasswordParams {
  mail: string
  code: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateUserInfoParams {
  nickname?: string
  email?: string
  avatar?: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/** 首次设置密码 POST `/apis/user/password` */
export interface SetPasswordParams {
  newPassword: string
  confirmPassword: string
}
