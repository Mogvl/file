package com.xddcodec.fs.system.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 管理员用户管理配置 VO
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Data
@Schema(description = "管理员用户管理配置")
public class UserConfigVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "默认初始密码（配置时回显，已配置的密码按掩码显示）")
    private String defaultPassword;

    @Schema(description = "新建用户首次登录是否强制修改密码 0-否 1-是")
    private Integer forceChangePasswordOnFirstLogin;
}
