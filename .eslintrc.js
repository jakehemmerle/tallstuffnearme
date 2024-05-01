module.exports = {
  env: {
    node: true,
    es2021: true,
    // Define 'module' as a global variable for Node.js environment
    'shared-node-browser': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g., "@typescript-eslint/explicit-function-return-type": "off",
  },
  settings: {
    react: {
      // Explicitly set the React version to the latest stable release
      version: '17.0',
    },
  },
  // Define 'module' as a global variable to avoid 'module is not defined' error
  globals: {
    module: 'readonly',
  },
};
