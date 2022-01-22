import typescript from '@rollup/plugin-typescript';

export default {
	input: [
		'src/index.ts',
		'src/renderer/preload.ts',
		'src/renderer/content.ts',
		'src/overlay/overlay-runtime.ts',
	],
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
};
