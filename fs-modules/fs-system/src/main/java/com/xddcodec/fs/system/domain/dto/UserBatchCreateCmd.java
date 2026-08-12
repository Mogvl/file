package com.xddcodec.fs.system.domain.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 管理员批量创建用户命令
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Data
public class UserBatchCreateCmd implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 用户列表
     */
    @NotEmpty(message = "用户列表不能为空")
    @Size(max = 100, message = "单次最多创建100个用户")
    private List<@Valid UserBatchItemCmd> users;

    /**
     * 角色ID（批量创建统一使用该角色）
     */
    @NotNull(message = "角色ID不能为空")
    private Long roleId;
}
