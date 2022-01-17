<template>
  <div>我是demo2</div>
  <button @click="$router.push('/account')">跳转login页面</button>
</template>

<script lang="ts" setup>
import { useStorage } from '@/plugin/storage';

const storage = useStorage();
storage.set('name', 'name');
</script>
