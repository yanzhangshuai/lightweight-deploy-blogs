import { flatMap } from 'lodash-es';
import { RouteRecordRaw } from 'vue-router';
import { isArray } from '@/util/is';
import { moduleFilter } from '@/util/helper';

/**
 * 遍历moduleRoutes
 * @returns
 */
const findModuleRoutes = (): Array<RouteRecordRaw> => {
  const modules = moduleFilter<Array<RouteRecordRaw> | RouteRecordRaw>(import.meta.globEager('./modules/*/index.ts'));

  return flatMap(
    Object.keys(modules).map((key) => {
      const module: Array<RouteRecordRaw> | RouteRecordRaw = modules[key] as Array<RouteRecordRaw> | RouteRecordRaw;
      return isArray(module) ? module : [module];
    })
  );
};

const moduleRoutes = findModuleRoutes();

export const routes: Array<RouteRecordRaw> = [
  ...moduleRoutes,
  {
    path: '/',
    redirect: '/home'
  }
];

export default routes;
