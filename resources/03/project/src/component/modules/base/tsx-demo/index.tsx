import { defineComponent } from 'vue';
import css from './index.module.less';
export default defineComponent({
  props: {
    msg: {
      type: String,
      default: ''
    }
  },
  setup() {
    const list = [1, 2, 3, 4, 5];

    return () => (
      <>
        <h1>我是tsx-demo</h1>
        {list.map((s) => (
          <li
            onClick={() => {
              console.log(s);
            }}
            class={css.li}>
            {s}
          </li>
        ))}
      </>
    );
  }
});
