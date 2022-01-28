// declare module "*.json" {
//   const value: unknown;
//   export default value;
// }
export {};
declare global {
  /**
   * 属性可写
   */
  export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  /**
   * 所有属性可写
   */
  export type DeepWritable<T> = {
    -readonly [K in keyof T]: keyof T[K] extends undefined ? T[K] : DeepWritable<T[K]>;
  };

  /**
   * 所有属性只读 递归
   */
  type DeepReadonly<T> = {
    readonly [K in keyof T]: keyof T[K] extends undefined ? T[K] : DeepReadonly<T[K]>;
  };

  /**
   * 所有属性可选 递归
   */
  type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
  };

  /**
   * setTimeout 返回类型
   */
  type Timeout = ReturnType<typeof setTimeout>;

  /**
   * setInterval 返回类型
   */
  type Timer = ReturnType<typeof setInterval>;

  type Nullable<T> = T | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Recordable<T = any> = Record<string, T>;

  type ValueType = string | number | boolean | undefined | null | Symbol;

  type IndexableType = string | number | Symbol;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * 或者类型, 类似 type | type  使用优于 type | type
   */
  type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Fn<T = any, R = T> {
    (...arg: Array<T>): R;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface PromiseFn<T = any, R = T> {
    (...arg: Array<T>): Promise<R>;
  }

  type RefType<T> = T | null;

  type EmitType = (event: string, ...args: Array<unknown>) => void;

  type TargetContext = '_self' | '_blank';

  interface ComponentElRef<T extends HTMLElement = HTMLDivElement> {
    $el: T;
  }

  type ComponentRef<T extends HTMLElement = HTMLDivElement> = ComponentElRef<T> | null;

  type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>;
}
