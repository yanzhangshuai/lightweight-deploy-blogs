import { tryOnMounted, tryOnUnmounted, useDebounceFn } from '@vueuse/core';

interface WindowSizeOptions {
  once?: boolean;
  immediate?: boolean;
  listenerOptions?: AddEventListenerOptions | boolean;
}

export function useWindowSize<T>(fn: Fn<T>, wait = 150, options?: WindowSizeOptions): Readonly<{ start: Fn<void>; stop: Fn<void> }> {
  let handler = () => {
    fn();
  };
  handler = useDebounceFn(handler, wait);

  const start = () => {
    if (options && options.immediate) {
      handler();
    }
    window.addEventListener('resize', handler);
  };

  const stop = () => {
    window.removeEventListener('resize', handler);
  };

  tryOnMounted(() => {
    start();
  });

  tryOnUnmounted(() => {
    stop();
  });
  return { start, stop };
}
