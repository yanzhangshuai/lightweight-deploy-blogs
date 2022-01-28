import { ref, watch, unref, Ref } from 'vue';
import { useThrottleFn, useDebounceFn } from '@vueuse/core';

export type RemoveEventFn = () => void;

export interface UseEventParams {
  el?: Element | Ref<Element | undefined> | Window | unknown;
  name: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
  autoRemove?: boolean;
  isDebounce?: boolean;
  wait?: number;
}

export function useEventListener({ el = window, name, listener, options, autoRemove = true, isDebounce = true, wait = 80 }: UseEventParams): Readonly<{ removeEvent: RemoveEventFn }> {
  /* eslint-disable-next-line */
  let remove: RemoveEventFn = () => {};
  const isAddRef = ref(false);

  if (el) {
    const element: Ref<Element> = ref<Element>((el || window) as Element) as unknown as Ref<Element>;

    const handler = isDebounce ? useDebounceFn(listener, wait) : useThrottleFn(listener, wait);
    const realHandler = wait ? handler : listener;
    const removeEventListener = (e: Element) => {
      isAddRef.value = true;
      e.removeEventListener(name, realHandler, options);
    };
    const addEventListener = (e: Element) => e.addEventListener(name, realHandler, options);

    const removeWatch = watch(
      element,
      (v, _ov, cleanUp) => {
        if (v) {
          !unref(isAddRef) && addEventListener(v);
          cleanUp(() => {
            autoRemove && removeEventListener(v);
          });
        }
      },
      { immediate: true }
    );

    remove = () => {
      removeEventListener(unref(element));
      removeWatch();
    };
  }
  return { removeEvent: remove };
}
