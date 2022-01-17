import { RouteRecordRaw } from 'vue-router';
import { HOME_PAGE_PATH, HomeRouterName } from '../const';

const router: RouteRecordRaw = {
  path: 'demo1',
  name: HomeRouterName.HOME_DEMO1_ROUTER,
  component: () => import(`@/page/home/demo1/index.vue`),
  meta: {
    title: 'demo1'
  }
};

export default router;
