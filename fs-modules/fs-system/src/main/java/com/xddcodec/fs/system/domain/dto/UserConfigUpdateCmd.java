package com.xddcodec.fs.system.domain.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 管理员用户管理配置命令
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Data
public class UserConfigUpdateCmd implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 管理员新建用户的默认初始密码（留空表示不修改）
     */
    @Size(min = 8, max = 128, message = "密码长度必须在8到128个字符之间")
    private String defaultPassword;

    /**
     * 新建用户首次登录是否强制修改密码 0-否 1-是
     */
    private Integer forceChangePasswordOnFirstLogin;
}
