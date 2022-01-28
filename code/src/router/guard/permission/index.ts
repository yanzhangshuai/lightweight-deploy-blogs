import { Router } from 'vue-router';

export function createPermissionGuard(router: Router): void {
  router.beforeEach((to, _, next) => {
    next();
  });
}
