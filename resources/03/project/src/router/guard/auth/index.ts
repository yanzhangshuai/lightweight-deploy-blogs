import { Router } from 'vue-router';
import { useUserStore } from '@/store/modules/user';

/**
 * 认证守卫
 * @param router
 */
export function createAuthGuard(router: Router): void {
  router.beforeEach((to, _, next) => {
    if (!to?.meta?.auth) {
      next();
      return;
    }
    //  如果当前需要登录,获取当前用户,进行认证
    const userStore = useUserStore();

    userStore
      .getUserInfo()
      .then(() => {
        next();
      })
      .catch(() => {
        //  失败跳转登录页
        next('/account/login');
      });
  });
}
