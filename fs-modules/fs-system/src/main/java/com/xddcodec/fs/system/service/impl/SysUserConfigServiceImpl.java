package com.xddcodec.fs.system.service.impl;

import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.xddcodec.fs.system.domain.SysUserConfig;
import com.xddcodec.fs.system.domain.dto.UserConfigUpdateCmd;
import com.xddcodec.fs.system.domain.vo.UserConfigVO;
import com.xddcodec.fs.system.mapper.SysUserConfigMapper;
import com.xddcodec.fs.system.service.SysUserConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import static com.xddcodec.fs.system.domain.table.SysUserConfigTableDef.SYS_USER_CONFIG;

/**
 * 管理员用户管理配置服务实现
 *
 * @Author: Mogvl
 * @Date: 2026/08/12
 */
@Service
@RequiredArgsConstructor
public class SysUserConfigServiceImpl extends ServiceImpl<SysUserConfigMapper, SysUserConfig> implements SysUserConfigService {

    /** 默认配置ID（单例配置，避免每次新建无意义记录） */
    private static final String DEFAULT_CONFIG_ID = "user-config-default";

    @Override
    public UserConfigVO getConfig() {
        SysUserConfig config = getOne(new QueryWrapper().orderBy(SYS_USER_CONFIG.UPDATED_AT, false));
        UserConfigVO vo = new UserConfigVO();
        if (config == null) {
            vo.setForceChangePasswordOnFirstLogin(0);
            return vo;
        }
        // 回显时密码用掩码，防止明文暴露
        vo.setDefaultPassword(StringUtils.hasText(config.getDefaultPassword()) ? "******" : null);
        vo.setForceChangePasswordOnFirstLogin(config.getForceChangePasswordOnFirstLogin() == null ? 0 : config.getForceChangePasswordOnFirstLogin());
        return vo;
    }

    @Override
    public void updateConfig(UserConfigUpdateCmd cmd) {
        SysUserConfig config = getOne(new QueryWrapper().orderBy(SYS_USER_CONFIG.UPDATED_AT, false));
        boolean isNew = false;
        if (config == null) {
            config = new SysUserConfig();
            config.setId(DEFAULT_CONFIG_ID);
            isNew = true;
        }
        // 仅在传入非空时更新密码（掩码"******"不写入）
        if (StringUtils.hasText(cmd.getDefaultPassword()) && !"******".equals(cmd.getDefaultPassword())) {
            config.setDefaultPassword(cmd.getDefaultPassword());
        }
        if (cmd.getForceChangePasswordOnFirstLogin() != null) {
            config.setForceChangePasswordOnFirstLogin(
                    cmd.getForceChangePasswordOnFirstLogin() == 1 ? 1 : 0);
        }
        if (isNew) {
            this.save(config);
        } else {
            this.updateById(config);
        }
    }

    @Override
    public String getDefaultPassword() {
        SysUserConfig config = getOne(new QueryWrapper().orderBy(SYS_USER_CONFIG.UPDATED_AT, false));
        return config == null ? null : config.getDefaultPassword();
    }

    @Override
    public boolean isForceChangePasswordOnFirstLogin() {
        SysUserConfig config = getOne(new QueryWrapper().orderBy(SYS_USER_CONFIG.UPDATED_AT, false));
        return config != null && config.getForceChangePasswordOnFirstLogin() != null
                && config.getForceChangePasswordOnFirstLogin() == 1;
    }
}
