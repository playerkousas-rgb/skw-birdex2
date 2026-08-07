module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  ignorePatterns: ['dist', 'node_modules', 'api', 'scripts', '*.cjs', '*.mjs', 'vite.config.ts'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    // tsc 的 strict 已負責檢查未使用變數，避免與 noUnusedLocals 重複報錯
    '@typescript-eslint/no-unused-vars': 'off',
    // 既有程式碼有大量 any 用法（錯誤處理），先放寬
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'react-refresh/only-export-components': 'off',
  },
};
