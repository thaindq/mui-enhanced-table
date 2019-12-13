import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
    input: './src/index.ts',
    output: {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    },
    plugins: [
        external({
            includeDependencies: true,
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        resolve(),
        babel(),
        typescript({
            typescript: require('typescript'),
            rollupCommonJSResolveHack: true,
            clean: true
        }),
        commonjs(),
        terser(),
    ],
}