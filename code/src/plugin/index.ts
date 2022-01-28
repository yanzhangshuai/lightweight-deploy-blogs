import { App } from 'vue';
import { setupStorage } from './storage';
import { setupGlobalProperty } from './global-property';

export function setupPlugin(app: App<Element>): App<Element> {
  setupStorage();
  setupGlobalProperty(app);
  return app;
}
