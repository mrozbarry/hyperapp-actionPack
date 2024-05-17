import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'actionPack.js',
  output: {
    file: 'actionPack.browser.js',
    format: 'cjs'
  },
  plugins: [nodeResolve()]
};
