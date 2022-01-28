module.exports = {
  //  依赖环境
  env: {
    //  浏览器
    browser: true,
    //  启用ES6特性（除modules）
    es6: true,
    'jest/globals': true
  },

  extends: ['plugin:vue/vue3-recommended', 'plugin:@typescript-eslint/recommended', 'plugin:jest/recommended', 'plugin:jest/style', 'plugin:prettier/recommended'],

  parser: 'vue-eslint-parser',
  //  解析器配置
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 2021,
    ecmaFeatures: {
      jsx: true
    },
    extraFileExtensions: [`.vue`, '.tsx'],
    vueFeatures: {
      interpolationAsNonHTML: true
    }
  },
  settings: {
    'import/resolver': {
      alias: [['@', './src']]
    }
  },

  //  第三方插件
  plugins: ['eslint-plugin-vue', 'eslint-plugin-promise', 'eslint-plugin-jest', '@typescript-eslint/eslint-plugin'],

  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  },
  rules: {
    'no-var': 2,
    'no-eval': 2,
    'no-alert': process.env.NODE_ENV !== 'production' ? 0 : 2,
    'no-console': process.env.NODE_ENV !== 'production' ? 0 : [1, { allow: ['warn', 'error'] }],
    'no-restricted-syntax': 2,
    'no-script-url': 2,
    'no-self-compare': 2,
    quotes: [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    eqeqeq: [2, 'always', { null: 'ignore' }],
    semi: [2, 'always', { omitLastInOneLineBlock: true }],
    'prefer-rest-params': 1,
    'object-curly-spacing': [2, 'always'],
    'array-bracket-spacing': 0,
    'space-infix-ops': 2,
    'space-before-blocks': 2,
    'block-spacing': [2, 'always'],
    'space-before-function-paren': 0,
    'no-lonely-if': 2,

    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/no-this-alias': 2,
    '@typescript-eslint/no-explicit-any': 2,
    '@typescript-eslint/no-namespace': 0,
    '@typescript-eslint/no-var-requires': 2,
    '@typescript-eslint/no-inferrable-types': 2,
    'vue/require-default-prop': 2,
    'vue/multi-word-component-names': 0,
    'vue/eqeqeq': [2, 'always', { null: 'ignore' }],
    'vue/max-attributes-per-line': [0, { singleline: 1, multiline: { max: 1, allowFirstLine: false } }],

    'jest/consistent-test-it': [2, { fn: 'it' }],
    'jest/no-disabled-tests': 1,
    'jest/no-focused-tests': 2,
    'jest/no-identical-title': 2,
    'jest/prefer-to-have-length': 1,
    'jest/valid-describe-callback': 2,
    'jest/valid-expect': 2,
    'jest/valid-expect-in-promise': 2
  },

  noInlineConfig: false,
  reportUnusedDisableDirectives: false
};
