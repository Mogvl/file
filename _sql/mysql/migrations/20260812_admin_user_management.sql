-- 管理员用户管理增强
-- 1. sys_user 增加 force_change_password 字段：管理员新建的用户首次登录是否强制修改密码
-- 2. 新建 sys_user_config 表：存储管理员配置的默认初始密码和强制改密开关

ALTER TABLE `sys_user`
  ADD COLUMN `force_change_password` tinyint(1) NOT NULL DEFAULT 0 COMMENT '首次登录是否强制修改密码(仅管理员新建用户)';

CREATE TABLE IF NOT EXISTS `sys_user_config` (
  `id` varchar(128) NOT NULL COMMENT '配置ID',
  `default_password` varchar(128) DEFAULT NULL COMMENT '管理员新建用户的默认初始密码(明文存储,仅本地部署)',
  `force_change_password_on_first_login` tinyint(1) NOT NULL DEFAULT 0 COMMENT '新建用户首次登录是否强制修改密码',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='管理员用户管理配置';
