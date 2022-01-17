import { createVNode } from 'vue';
import { RouteRecordRaw, RouterView } from 'vue-router';
import { ACCOUNT_PAGE_PATH, AccountRouterName } from './const';

const router: RouteRecordRaw = {
  path: '/account',
  name: AccountRouterName.ACCOUNT_ROUTER,
  component: () => Promise.resolve(createVNode(RouterView)),
  children: [
    {
      path: '',
      redirect: { name: AccountRouterName.ACCOUNT_LOGIN_ROUTER }
    },
    {
      path: 'login',
      name: AccountRouterName.ACCOUNT_LOGIN_ROUTER,
      component: () => import(`@/page/account/login/index.vue`)
    },
    {
      path: 'register',
      name: AccountRouterName.ACCOUNT_REGISTER_ROUTER,
      component: () => import(`@/page/account/register/index.vue`)
    }
  ]
};

export default router;
