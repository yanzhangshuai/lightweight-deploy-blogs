import { Directive } from 'vue';

const numberInputDirective: Directive = {
  name: 'number',
  mounted(el: HTMLInputElement): void {
    // TODO: 1.未处理中文
    el.addEventListener('keydown', (options) => {
      if (/^[a-z,A-Z]$/.test(options.key)) {
        el.value = el.value.replace(/D/g, '');
        options.preventDefault();
      }
    });
  }
};

export default numberInputDirective;
