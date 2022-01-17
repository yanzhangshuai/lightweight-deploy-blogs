import { App, Directive } from 'vue';
import { moduleFilter } from '@/util/helper';

function injectDirectives(app: App<Element>) {
  const modules = moduleFilter<Directive>(import.meta.globEager('./modules/**/*.{ts,js}'));

  //  匹配文件名称的正则
  //TODO 正则没有全部满足
  const directiveRegex = /\/([\w\d-]+)([.-]?[dD]irective)?\/([\w\d-]+)([.-]?[dD]irective)?\.[tj]s$/;

  Object.keys(modules).forEach((key) => {
    const directive = modules[key] as Directive;
    const fileMatch = key.match(directiveRegex);

    //  获取组件名称
    //  组件名称匹配规则
    //  1.获取模块中name属性
    //  2. 如果文件名称不为index, 则取文件名称作为name, 否则取文件名称的上一级目录作为组件名称 文件名称和目录名称都会去掉[.-]directive
    const directiveName = directive?.name || (fileMatch[3] && fileMatch[3] !== 'index' ? fileMatch[3] : fileMatch[1]);

    app.directive(directiveName, directive);
  });
}

export function setupDirective(app: App<Element>): App<Element> {
  injectDirectives(app);
  return app;
}
