import { unref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTitle as usePageTitle } from '@vueuse/core';

export function useTitle(): void {
  const { currentRoute } = useRouter();

  const pageTitle = usePageTitle();

  watch(
    () => currentRoute.value.path,
    () => {
      const route = unref(currentRoute);
      console.log('route', route);
      pageTitle.value = route?.meta?.title as string;
    },
    { immediate: true }
  );
}
