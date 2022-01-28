import type { Plugin } from 'vite';
import html from 'vite-plugin-html';

export function htmlPlugin(isBuild: boolean, title: string): Array<Plugin> {
  return html({
    minify: isBuild,
    inject: {
      // Inject data into ejs template
      injectData: {
        title: title
      },
      tags: []
    }
  });
}
