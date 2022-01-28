import { StateTree } from 'pinia';

declare module 'pinia' {
  export interface DefineStoreOptions<Id extends string, S extends StateTree, G, A> {
    debounce?: {
      [k in keyof A]?: number;
    };
  }

  export interface Pinia {
    name: string;
  }
}

export {};
