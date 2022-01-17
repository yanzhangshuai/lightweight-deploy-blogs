import { App } from 'vue';
import { createRouter, createWebHistory, Router, RouteRecordRaw } from 'vue-router';
import routes from './route';
import { setupRouterGuard } from './guard';

let router: Router;

export function setupRouter(app: App<Element>): App<Element> {
  router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes as Array<RouteRecordRaw>,
    strict: false,
    scrollBehavior: () => ({ left: 0, top: 0 })
  });

  app.use(router);
  setupRouterGuard(router);
  return app;
}

export async function isReady(): Promise<void> {
  if (!router) return;
  await router.isReady();
}
