import { ref, watch, Ref } from 'vue';
import { tryOnUnmounted } from '@vueuse/core';
import { isFunction } from '@/util/is';

export function useTimeout(handle: Fn<unknown>, wait: number, native = false): Readonly<{ readyRef: Ref<boolean>; start: Fn<void>; stop: Fn<void> }> {
  if (!isFunction(handle)) {
    throw new Error('handle is not Function!');
  }

  const { readyRef, stop, start } = useTimeoutRef(wait);
  if (native) {
    handle();
  } else {
    watch(
      readyRef,
      (maturity) => {
        maturity && handle();
      },
      { immediate: false }
    );
  }
  return { readyRef, stop, start };
}

export function useTimeoutRef(wait: number): {
  readyRef: Ref<boolean>;
  start: Fn<void>;
  stop: Fn<void>;
} {
  const readyRef = ref(false);

  let timer: Timeout;
  function stop(): void {
    readyRef.value = false;
    timer && window.clearTimeout(timer);
  }
  function start(): void {
    stop();
    timer = setTimeout(() => {
      readyRef.value = true;
    }, wait);
  }

  start();

  tryOnUnmounted(stop);

  return { readyRef, stop, start };
}
