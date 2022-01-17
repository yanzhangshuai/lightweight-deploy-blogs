import { Plugin } from 'vite';
import { Env } from '../type';
import { vuePlugin } from './plugins/vue';
import { htmlPlugin } from './plugins/html';
import { reportPlugin } from './plugins/report';
import { compressPlugin } from './plugins/compress';

export function createVitePlugins(viteEnv: Env, isBuild: boolean): Array<Plugin | Array<Plugin>> {
  return [
    vuePlugin(viteEnv.VITE_SUPPORT_JSX),
    htmlPlugin(isBuild, viteEnv.VITE_APP_TITLE),
    viteEnv.VITE_REPORT && reportPlugin(),
    isBuild && compressPlugin(viteEnv.VITE_BUILD_COMPRESS, viteEnv.VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE)
  ].filter(Boolean);
}
