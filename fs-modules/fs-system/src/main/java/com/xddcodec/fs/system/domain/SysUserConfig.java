package com.xddcodec.fs.system.domain;

import com.mybatisflex.annotation.Id;
import com.mybatisflex.annotation.KeyType;
import com.mybatisflex.annotation.Table;
import com.mybatisflex.core.keygen.KeyGenerators;
import com.xddcodec.fs.framework.orm.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * 管理员用户管理配置
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Data
@Table("sys_user_config")
@EqualsAndHashCode(callSuper = true)
public class SysUserConfig extends BaseEntity {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 配置ID
     */
    @Id(keyType = KeyType.Generator, value = KeyGenerators.ulid)
    private String id;

    /**
     * 管理员新建用户的默认初始密码(明文存储,仅本地部署)
     */
    private String defaultPassword;

    /**
     * 新建用户首次登录是否强制修改密码 0-否 1-是
     */
    private Integer forceChangePasswordOnFirstLogin;
}
