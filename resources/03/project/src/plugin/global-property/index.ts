import { App } from 'vue';
import { dateFormat } from '@/util/date';
import { GlobalProps } from './type';

let globalProps: GlobalProps;

export function setupGlobalProperty(app: App<Element>): App<Element> {
  globalProps = {
    FILE_PATH_PREFIX: import.meta.env.GLOBAL_FILE_PATH,
    DEV: import.meta.env.DEV,
    dateFormat: dateFormat
  };

  Object.defineProperty(app.config.globalProperties, '$window', {
    enumerable: false,
    get() {
      return window;
    }
  });

  Object.defineProperty(app.config.globalProperties, '$globalProps', {
    enumerable: false,
    get() {
      return globalProps;
    }
  });
  return app;
}

export function useGlobalProps(): DeepReadonly<GlobalProps> {
  return globalProps;
}
