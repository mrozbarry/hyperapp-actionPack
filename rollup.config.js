import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'actionPack.js',
  output: {
    file: 'actionPack.bundle.js',
    format: 'esm'
  },
  plugins: [
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
    }),
  ]
};
