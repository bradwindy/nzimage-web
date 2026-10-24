import nextPlugin from 'eslint-config-next';

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', '.wrangler/**', 'worker/worker-configuration.d.ts'],
  },
  ...nextPlugin,
];

export default eslintConfig;
