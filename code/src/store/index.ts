import { App } from 'vue';
import { debounce } from 'lodash-es';
import { createPinia, Pinia } from 'pinia';

export type Store = Pinia;

let store: Store;

export function setupStore(app: App<Element>): App<Element> {
  const store = createPinia();

  store.name = 'pinia';

  store.use(({ options, store }) => {
    if (options.debounce) {
      return Object.keys(options.debounce).reduce(
        (debouncedActions, action) => {
          debouncedActions[action] = debounce(store[action], options.debounce[action]);
          return debouncedActions;
        },
        {} as {
          [k in keyof typeof options.actions]: Function;
        }
      );
    }
  });
  app.use(store);
  return app;
}

export function useStore(): Readonly<Store> {
  return store;
}
