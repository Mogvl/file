package com.xddcodec.fs.system.service;

import com.mybatisflex.core.service.IService;
import com.xddcodec.fs.system.domain.SysUserConfig;
import com.xddcodec.fs.system.domain.dto.UserConfigUpdateCmd;
import com.xddcodec.fs.system.domain.vo.UserConfigVO;

/**
 * 管理员用户管理配置服务
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
public interface SysUserConfigService extends IService<SysUserConfig> {

    /**
     * 获取配置（无记录时返回默认值）
     */
    UserConfigVO getConfig();

    /**
     * 更新配置
     */
    void updateConfig(UserConfigUpdateCmd cmd);

    /**
     * 获取默认初始密码（未配置返回 null）
     */
    String getDefaultPassword();

    /**
     * 新建用户是否默认强制首次登录改密
     */
    boolean isForceChangePasswordOnFirstLogin();
}
