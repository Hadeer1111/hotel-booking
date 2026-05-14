module.exports = {
  ...require('@hotel-booking/config/eslint-base.cjs'),
  root: true,
  env: { node: true, jest: true },
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  rules: {
    ...require('@hotel-booking/config/eslint-base.cjs').rules,
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
