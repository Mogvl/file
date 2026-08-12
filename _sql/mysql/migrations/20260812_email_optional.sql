-- 管理员创建用户支持无邮箱账号：将 sys_user.email 改为可空
ALTER TABLE `sys_user`
  MODIFY COLUMN `email` varchar(128) NULL DEFAULT NULL COMMENT '邮箱地址';