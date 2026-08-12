package com.xddcodec.fs.system.service;

import com.xddcodec.fs.system.domain.SysUser;
import com.xddcodec.fs.system.domain.dto.*;
import com.xddcodec.fs.system.domain.vo.SysUserVO;
import com.mybatisflex.core.service.IService;
import org.springframework.web.multipart.MultipartFile;

/**
 * 用户服务接口
 *
 * @Author: xddcode
 * @Date: 2024/6/7 11:08
 */
public interface SysUserService extends IService<SysUser> {

    /**
     * 根据用户名获取用户信息
     *
     * @param username
     * @return
     */
    SysUser getByUsername(String username);

    /**
     * 根据邮箱获取用户信息
     *
     * @param email
     * @return
     */
    SysUser getByMail(String email);

    /**
     * 获取用户信息
     *
     * @return
     */
    SysUserVO getDetail();

    /**
     * 注册用户
     *
     * @param cmd
     */
    void register(UserRegisterCmd cmd);

    /**
     * 管理员创建用户（创建账号 + 加入当前工作空间 + 设置角色）
     *
     * @param cmd
     */
    void createByAdmin(UserCreateByAdminCmd cmd);

    /**
     * 管理员批量创建用户
     *
     * @param cmd
     * @return 实际创建数量
     */
    int batchCreateByAdmin(UserBatchCreateCmd cmd);

    /**
     * 管理员删除用户（级联清理成员关系、传输配置、收藏、分享、传输任务、收集、登录日志）
     *
     * @param userId
     */
    void deleteByAdmin(String userId);

    /**
     * 编辑用户个人信息
     *
     * @param cmd
     * @return
     */
    void editUserInfo(UserEditInfoCmd cmd);

    /**
     * 修改邮箱-发送邮箱验证码
     *
     * @param mail
     */
    void sendUpdateMailCode(String mail);

    /**
     * 修改邮箱-验证邮箱验证码
     *
     * @param cmd
     */
    void updateMail(UserEditMailCmd cmd);

    /**
     * 上传头像
     *
     * @param file
     * @return
     */
    void uploadAvatar(MultipartFile file);

    /**
     * 修改密码
     *
     * @param cmd
     * @return
     */
    void updatePassword(PasswordEditCmd cmd);

    /**
     * 设置密码
     *
     * @param cmd
     * @return
     */
    void setPassword(PasswordAddCmd cmd);


    /**
     * 忘记密码-发送验证码
     *
     * @param email
     */
    void sendForgetPasswordCode(String email);

    /**
     * 忘记密码-修改密码
     *
     * @param cmd
     */
    void updateForgetPassword(PasswordForgetEditCmd cmd);
}
