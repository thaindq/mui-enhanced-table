import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import autoExternal from 'rollup-plugin-auto-external';
import { terser } from "rollup-plugin-terser";
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
    input: 'src/index.ts',
    output: {
        file: pkg.main,
        format: 'esm',
        exports: 'named',
        sourcemap: true,
    },
    plugins: [
        autoExternal(),
        replace({
            preventAssignment: true,
            // Apply optimizations
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        resolve({
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
        }),
        typescript({
            clean: true,
        }),
        commonjs(),
        terser(),
    ],
}