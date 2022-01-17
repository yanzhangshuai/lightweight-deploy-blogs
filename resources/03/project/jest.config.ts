import { defaults as tsjPreset } from 'ts-jest/presets';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  roots: ['<rootDir>/test/'],
  transform: {
    ...tsjPreset.transform,
    '.*\\.(vue)$': 'vue-test'
    // [...]
  },

  moduleFileExtensions: ['ts', 'tsx', 'vue-test', 'js', 'jsx', 'json', 'node']
};
