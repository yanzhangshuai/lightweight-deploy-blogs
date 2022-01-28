const toString = Object.prototype.toString;

export function is(val: unknown, type: string): boolean {
  return toString.call(val) === `[object ${type}]`;
}

export function isDef<T = unknown>(val?: T): val is T {
  return typeof val !== 'undefined';
}

export function isUnDef<T = unknown>(val?: T): val is undefined {
  return !isDef(val);
}

export function isNull(val: unknown): val is null {
  return val === null;
}

export function isNil(val: unknown): val is null | undefined {
  return isUnDef(val) || isNull(val);
}

export function isObject(val: unknown): val is Record<string | number | symbol, unknown> {
  return val !== null && is(val, 'Object');
}

export function isEmpty<T = unknown>(val: T): val is T {
  if (isArray(val) || isString(val)) {
    return val.length === 0;
  }

  if (val instanceof Map || val instanceof Set) {
    return val.size === 0;
  }

  if (isObject(val)) {
    return Object.keys(val).length === 0;
  }

  return false;
}

export function isDate(val: unknown): val is Date {
  return is(val, 'Date');
}

export function isNumber(val: unknown): val is number {
  return is(val, 'Number');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isNumeric(val: any): val is number | string {
  return !isArray(val) && !isObject(val) && val - parseFloat(val) + 1 >= 0;
}

export function isPromise<T = unknown>(val: unknown): val is Promise<T> {
  return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch);
}

export function isString(val: unknown): val is string {
  return is(val, 'String');
}

export function isFunction(val: unknown): val is Function {
  return typeof val === 'function';
}

export function isBoolean(val: unknown): val is boolean {
  return is(val, 'Boolean');
}

export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp');
}

export function isArray(val: unknown): val is Array<unknown> {
  return val && Array.isArray(val);
}

export function isWindow(val: unknown): val is Window {
  return typeof window !== 'undefined' && is(val, 'Window');
}

export function isElement(val: unknown): val is Element {
  return isObject(val) && !!val.tagName;
}

export const isServer = typeof window === 'undefined';

export const isClient = !isServer;

export function isUrl(path: string): boolean {
  const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%\/.\w-_]*)?\??[-+=&;%@.\w_]*#?[\w]*)?)$/;
  return reg.test(path);
}
