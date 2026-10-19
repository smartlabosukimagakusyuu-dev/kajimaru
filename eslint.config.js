// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // functions はサーバー側のコードなので、別に管理する
    ignores: ['dist/*', 'functions/*'],
  },
]);
