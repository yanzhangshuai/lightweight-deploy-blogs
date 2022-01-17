declare module 'vue' {
  export interface GlobalComponents {
    'tsx-demo': typeof import('@/component/modules/base/tsx-demo/index')['default'];
    'ref-demo': typeof import('@/component/modules/base/ref-demo/index.vue')['default'];
    'ref-setup-demo': typeof import('@/component/modules/base/ref-setup-demo/index.vue')['default'];
    'config-provider': typeof import('@/component/modules/base/config-provider/index.vue')['default'];
  }
}
export {};
