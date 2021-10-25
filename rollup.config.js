import typescript from '@rollup/plugin-typescript';

export default {
	input: [
		'src/index.ts',
		'src/renderer/preload.ts',
		'src/renderer/content.ts',
	],
	output: {
		dir: 'dist',
		format: 'cjs',
		sourcemap: 'inline',
	},
	external: [
		'electron',
		'path',
	],
	plugins: [
		typescript(),
	],
};
