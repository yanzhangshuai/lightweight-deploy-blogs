import { unref } from 'vue';
import { Router, useRouter } from 'vue-router';

export function useReload(router?: Router): PromiseFn<never, boolean> {
  let _router: Router;
  !router && (_router = useRouter());

  const { push, currentRoute } = router || _router;
  const { query, params } = currentRoute.value;
  return (): Promise<boolean> => {
    return new Promise((resolve) => {
      push({
        path: unref(currentRoute).fullPath,
        query,
        params
      }).then(() => resolve(true));
    });
  };
}
