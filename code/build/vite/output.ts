import { GetManualChunkApi, PreRenderedAsset } from 'rollup';

export function assetFileNames(chunkInfo: PreRenderedAsset): string {
  return '[ext]/[name].[hash].[ext]';
}

const PAGE_REGEX = /src\/page\/(\w+)\//;

const VUE_REGEX = /\/node_modules\/(@vue)/;

const REGEX_CHUNK = [VUE_REGEX, PAGE_REGEX];

/**
 * 生成chunk
 * @param id
 * @param api
 */
export function manualChunks(id: string, api: GetManualChunkApi): string | null | undefined {
  const matchedRegex = REGEX_CHUNK.find((regex) => regex.test(id));

  if (!matchedRegex) return 'index';

  return id.match(matchedRegex)?.[1] || 'index';
}
