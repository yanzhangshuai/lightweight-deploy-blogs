import { AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse, CancelToken } from 'axios';

export interface HttpOptions {
  authenticationScheme?: string;
  urlPrefix?: string;
  request?: HttpRequestConfig;
}

export type InterceptorManager = {
  request: AxiosInterceptorManager<HttpRequestConfig>;
  response: AxiosInterceptorManager<HttpResponse<unknown>>;
};

export interface HttpResponse<T> extends AxiosResponse<T> {
  config: HttpRequestConfig;
}

export interface HttpRequestConfig extends AxiosRequestConfig {
  /**
   * 是否忽略取消
   */
  ignoreCancelToken?: boolean;
  /**
   * 是否返回全部Response信息
   */
  returnAllResponse?: boolean;
}

// multipart/form-data: upload file
export interface HttpUploadRequestConfig extends HttpRequestConfig {
  // Other parameters
  data?: Record<string, XOR<string, Array<string>>>;
  // File parameter interface field name
  name?: string;
  // file name
  file?: XOR<File, Blob>;
  // file name
  filename?: string;

  cancelToken?: CancelToken;
}
