import qs from 'qs';
import { cloneDeep } from 'lodash-es';
import axios, { AxiosInstance } from 'axios';
import { HttpClientCanceler } from './canceler';

import { HttpResponse, HttpRequestConfig, HttpUploadRequestConfig, HttpOptions, InterceptorManager } from './type';

export class Http {
  private _axios: AxiosInstance;
  private _options: HttpOptions;
  private _canceler: HttpClientCanceler;

  constructor(options?: HttpOptions) {
    this.createAxios(options);

    this.setupCancelInterceptor();
  }

  get options(): HttpOptions {
    return this._options;
  }

  get axios(): AxiosInstance {
    return this._axios;
  }

  get interceptor(): InterceptorManager {
    return this.axios.interceptors;
  }

  get canceler(): HttpClientCanceler {
    return this._canceler;
  }

  /**
   * @description: 重新配置Option
   */
  resetConfig(options: HttpOptions): Http {
    if (!this.axios) {
      return;
    }

    this.createAxios(options);
    return this;
  }

  // support form-data
  private supportFormData(config: HttpRequestConfig): HttpRequestConfig {
    const headers = config.headers || this.options?.request?.headers || {};
    const contentType = headers?.['Content-Type'] || headers?.['content-type'];

    if (contentType !== 'application/x-www-form-urlencoded;charset=UTF-8' || !Reflect.has(config, 'data') || config.method?.toUpperCase() === 'GET') {
      return config;
    }

    return {
      ...config,
      data: qs.stringify(config.data, { arrayFormat: 'brackets' })
    };
  }

  /**
   * @description: 设置header
   */
  setHeader(headers: Record<string, unknown>): void {
    if (!this.axios) {
      return;
    }
    Object.assign(this.axios.defaults.headers, headers);
  }

  get<T = unknown, R = T>(url: string, query?: Record<string, unknown>, config?: HttpRequestConfig): Promise<R> {
    config = config || {};
    config.params = { ...(config.params || {}), ...(query || {}) };
    return this.request<T, R>(url, { ...config, method: 'GET' });
  }

  post<T = unknown, R = T>(url: string, data?: Record<string, unknown>, query?: Record<string, unknown>, config?: HttpRequestConfig): Promise<R> {
    config = config || {};
    config.data = { ...(config.data || {}), ...(data || {}) };
    config.params = { ...(config.params || {}), ...(query || {}) };
    return this.request(url, { ...config, method: 'POST' });
  }

  put<T = unknown, R = T>(url: string, query?: Record<string, unknown>, config?: HttpRequestConfig): Promise<R> {
    config = config || {};
    config.params = { ...(config.params || {}), ...(query || {}) };
    return this.request(url, { ...config, method: 'PUT' });
  }

  delete<T = unknown, R = T>(url: string, query?: Record<string, unknown>, config?: HttpRequestConfig): Promise<R> {
    config = config || {};
    config.params = { ...(config.params || {}), ...(query || {}) };
    return this.request<T, R>(url, { ...config, method: 'DELETE' });
  }

  request<T = unknown, R = T>(url: string, config: HttpRequestConfig): Promise<R> {
    let conf = {
      ...cloneDeep(this.options.request || {}),
      ...cloneDeep(config || {})
    };

    conf = this.supportFormData(conf);

    conf.url = url;

    return new Promise<R>((resolve, reject) => {
      this.axios
        .request<T, HttpResponse<T>>(conf)
        .then((res: HttpResponse<T>) => {
          const data: R = (config.returnAllResponse ? res : res.data) as unknown as R;
          resolve(data);
        })
        .catch((e: Error) => {
          reject(e);
        });
    });
  }

  uploadFile<T = unknown, R = T>(url: string, config: HttpUploadRequestConfig): Promise<R> {
    const formData = new window.FormData();

    Object.keys(config?.data || {}).forEach((key) => {
      if (!config.data) return;
      const value = config.data[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          formData.append(`${key}[]`, item);
        });
        return;
      }

      formData.append(key, value);
    });

    formData.append(config.name || 'file', config.file, config.filename || config.file?.name || '');

    return new Promise<R>((resolve, reject) => {
      this.axios
        .request<T, HttpResponse<T>>({
          url: url,
          ...config,
          method: config.method || 'POST',
          data: formData,
          headers: {
            'Content-type': 'multipart/form-data;charset=UTF-8',
            ...(config.headers || {})
          },
          cancelToken: config.cancelToken
        })
        .then((res) => {
          const data: R = (config.returnAllResponse ? res : res.data) as unknown as R;
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * @description:
   */
  private createAxios(options: HttpOptions): void {
    this._options = options || {};
    this._axios = axios.create(options?.request || {});
  }

  /**
   * @description: 拦截器设置
   */
  private setupCancelInterceptor() {
    this._canceler = new HttpClientCanceler();
    this.axios.interceptors.request.use((conf: HttpRequestConfig) => {
      !conf.ignoreCancelToken && this.canceler.addPending(conf);

      return conf;
    }, undefined);

    this.axios.interceptors.response.use((res: HttpResponse<unknown>) => {
      !res.config.ignoreCancelToken && this.canceler.removePending(res.config);
      return res;
    }, undefined);
  }
}
