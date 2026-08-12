package com.xddcodec.fs.system.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 管理员删除用户命令
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Data
public class UserDeleteCmd implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 要删除的用户ID
     */
    @NotBlank(message = "用户ID不能为空")
    private String userId;
}
