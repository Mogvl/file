package com.xddcodec.fs.system.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.xddcodec.fs.framework.common.domain.Result;
import com.xddcodec.fs.system.domain.dto.UserConfigUpdateCmd;
import com.xddcodec.fs.system.domain.vo.UserConfigVO;
import com.xddcodec.fs.system.service.SysUserConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员用户管理配置控制器
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@RestController
@RequestMapping("/apis/user-config")
@RequiredArgsConstructor
@Tag(name = "用户管理配置")
public class UserConfigController {

    private final SysUserConfigService configService;

    @Operation(summary = "获取用户管理配置")
    @GetMapping
    @SaCheckPermission("member:manage")
    public Result<UserConfigVO> getConfig() {
        return Result.ok(configService.getConfig());
    }

    @Operation(summary = "更新用户管理配置")
    @PutMapping
    @SaCheckPermission("member:manage")
    public Result<?> updateConfig(@Valid @RequestBody UserConfigUpdateCmd cmd) {
        configService.updateConfig(cmd);
        return Result.ok();
    }
}
