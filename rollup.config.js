import typescript from '@rollup/plugin-typescript';

export default [
	'src/index.ts',
	'src/renderer/preload.ts',
	'src/renderer/content.ts',
	'src/overlay/overlay-runtime.ts',
].map(input => ({
	input,
	output: {
		dir: 'dist',
		format: 'cjs',
		sourcemap: 'inline',
	},
	external: [
		'electron',
		'path',
		'fs',
		'child_process',
	],
	plugins: [
		typescript(),
	],
}));
