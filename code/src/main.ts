import { createApp } from 'vue';
import { setupStore } from '@/store';
import { setupPlugin } from '@/plugin';
import { setupService } from './service';
import { setupComponent } from '@/component';
import { setupDirective } from '@/directive';
import { isReady, setupRouter } from '@/router';
import App from '@/page/app.vue';
import '@/asset/style/index.less';

const app = createApp(App);

setupPlugin(app);

setupComponent(app);

setupDirective(app);

setupRouter(app);

setupService(app);

setupStore(app);

//  等待router
isReady().then(() => {
  app.mount('#app');
});
