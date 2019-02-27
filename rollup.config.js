import pkg from './package.json';

const external = ['react'];

export default [
  {
    input: './compiled/index.js',
    external: external.concat(Object.keys(pkg.dependencies)),
    output: [
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
      },
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
    ],
  },
];
