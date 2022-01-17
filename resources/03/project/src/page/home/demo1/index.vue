<template>
  <div class="text-red-600" @click="$window.alert('1')">我是demo1</div>
  <button @click="$router.push('/home/demo2')">Go To Demo2</button>
  <ref-setup-demo :id="123" ref="refSetupDemoRef" v-model:name="name"></ref-setup-demo>
  <ref-demo ref="refDemoRef"></ref-demo>
  <tsx-demo />
  <p>文件服务器地址 :{{ $globalProps.FILE_PATH_PREFIX }}</p>
  <p>当前环境 :{{ $globalProps.DEV }}</p>
  <p>当前时间 :{{ $globalProps.dateFormat($window.Date.now()) }}</p>
</template>

<script lang="ts" setup>
import { onMounted, ref, unref } from 'vue';
import RefSetupDemo from '@/component/modules/base/ref-setup-demo/index.vue';
import RefDemo from '@/component/modules/base/ref-demo/index.vue';
import { useHttp } from '@/service';

const refSetupDemoRef = ref(null);
const refDemoRef = ref<InstanceType<typeof RefDemo>>(null);
const http = useHttp();

onMounted(() => {
  http.get('/api/posts/1').then((res) => {
    console.log('我是posts/1返回的结果', res);
  });
});
const name = ref('123');
</script>
