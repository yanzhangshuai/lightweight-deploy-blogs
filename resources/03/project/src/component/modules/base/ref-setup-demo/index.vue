<template>
  <h1>{{ name }}</h1>
  <button @click="onBtn">btn</button>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  id: number;
  value?: { name: string };
}>();

const emit = defineEmits(['update:name']);

const onBtn = () => {
  emit('update:name', Math.random().toString());
};
defineExpose({
  onBtn,
  name: props.name
});
</script>
<style lang="less" scoped></style>
