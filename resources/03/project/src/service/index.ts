import { App } from 'vue';
import { Http } from './http/index';
import { setupInterceptor } from './interceptor/index';

let http: Http;
export function setupService(app: App<Element>): App<Element> {
  http = new Http({ request: { ignoreCancelToken: false } });

  setupInterceptor(http.interceptor);

  return app;
}

export function useHttp(): DeepReadonly<Http> {
  return http;
}
