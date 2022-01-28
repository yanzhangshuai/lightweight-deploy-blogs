import { defineStore } from 'pinia';

export const useCounterStore = defineStore({
  id: 'app-counter',
  state: () => ({ count: 1 }),
  getters: {
    double(state): number {
      return state.count * 2;
    }
  },
  actions: {
    increment() {
      this.count++;
    },
    increment2() {
      this.count++;
    }
  },

  debounce: {
    increment: 3000
  }
});
