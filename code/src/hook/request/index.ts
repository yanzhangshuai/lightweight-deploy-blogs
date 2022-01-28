// /**
//  * @description useRequest Hooks
//  * @author Wynne
//  * @param {() => AxiosPromise<T>} request
//  * @param {IRequestConfig} [config]
//  */
// import { Method } from 'axios';
// import { Ref, ref } from 'vue';
// import { Singleton } from '@/utils/singleton';

// interface IRequestConfig {
//   /**
//    * 请求方式,默认为 get
//    */
//   method?: Method;

//   /**
//    * query参数
//    */
//   query?: Record<string, ValueType>;

//   /**
//    * body参数
//    */
//   data?: Record<string, unknown>;
//   // 是否手动请求
//   manual?: boolean;
//   // 防抖毫秒数
//   debounce?: number;
//   // swr的缓存key
//   cacheKey?: string;
// }

// // 缓存
// const cache = new Map<string, unknown>();

// // 防抖

// export function useRequest<T>(uri: string, config?: IRequestConfig): { loading: Ref<boolean>, data: Ref<T>, error: Ref<unknown>, run: () => Promise<T> } {
//   // 是否加载中
//   const loading = ref(false);
//   // 返回数据
//   const data = ref<T>();

//   const error = ref<unknown>();
//   // 执行请求方法
//   const run = () => {
//     return new Promise<T>((resolve, reject) => {

//       // 如果配置了缓存且命中时，先返回缓存再做请求
//       if (config?.cacheKey && cache.has(config.cacheKey)) {
//         data.value = cache.get(config.cacheKey) as T;
//       }
//       loading.value = true;
//       Singleton.make(Http).request<T>(
//         uri,
//         config?.method || 'get',
//         config?.data,
//         config?.query
//       ).then((res) => {
//         loading.value = false;
//         if (config?.cacheKey) {
//           cache.set(config.cacheKey, res);
//         }
//         data.value = res;
//         resolve(res);
//       }, err => {
//         error.value = err;
//         reject(err);
//       });
//     });
//   };

//   // 如果需要立即执行
//   if (!config?.manual) {
//     run().then();
//   }
//   return { loading, data, error, run: run };
// }
