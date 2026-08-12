package com.xddcodec.fs.system.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 管理员批量创建用户单条记录
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Data
public class UserBatchItemCmd implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 32, message = "用户名长度必须在2到32个字符之间")
    private String username;

    /**
     * 昵称
     */
    @NotBlank(message = "昵称不能为空")
    @Size(max = 32, message = "昵称长度不能超过32个字符")
    private String nickname;

    /**
     * 邮箱（可选）
     */
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 初始密码（为空时使用管理员配置的默认初始密码）
     */
    @Size(min = 8, max = 128, message = "密码长度必须在8到128个字符之间")
    private String password;
}
