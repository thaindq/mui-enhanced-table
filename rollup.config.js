import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import { DEFAULT_EXTENSIONS } from '@babel/core';

const extensions = [ ...DEFAULT_EXTENSIONS, '.json', '.ts', '.tsx' ];

export default {
    input: 'src/index.ts',
    output: {
        file: pkg.main,
        format: 'esm',
        exports: 'named',
        sourcemap: false,
    },
    plugins: [
        external(),
        replace({
            // Apply optimizations
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        resolve({
            extensions
        }),
        typescript({
            typescript: require('typescript'),
            clean: true
        }),
        babel({
            // https://www.npmjs.com/package/rollup-plugin-typescript2#rollup-plugin-babel
            extensions,
            exclude: 'node_modules/**'
        }),
        commonjs({
            // https://rollupjs.org/guide/en/#error-name-is-not-exported-by-module
            namedExports: {
                'node_modules/prop-types/index.js': [
                    'elementType'
                ],
                'node_modules/react/index.js': [
                    'isValidElement',
                    'cloneElement',
                    'useState',
                    'useRef',
                    'useEffect',
                    'useLayoutEffect',
                    'useMemo',
                    'Children',
                ],
                'node_modules/react-is/index.js': [
                    'isFragment',
                    'isValidElementType',
                    'isContextConsumer',
                    'ForwardRef',
                ]
            }
        }),
        // terser(),
    ],
}