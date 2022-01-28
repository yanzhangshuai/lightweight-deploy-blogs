<template>
  <div>123</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    return {
      onClick: () => {
        console.log('RefDemoComponent');
      }
    };
  }
});
</script>
<style lang="less" scoped></style>
