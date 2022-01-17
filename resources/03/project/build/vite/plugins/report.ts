import { Plugin } from 'vite';
import visualizer from 'rollup-plugin-visualizer';

export function reportPlugin(): Plugin {
  return visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
    template: 'treemap' // "sunburst" | "treemap" | "network"
  });
}
