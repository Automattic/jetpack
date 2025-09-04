import { defineConfig } from 'tsup';

export default defineConfig( {
	entry: [
		'src/index.ts',
		'src/components/index.ts',
		'src/hooks/index.ts',
		'src/providers/index.ts',
		'src/visx/index.ts',
	],
	clean: true,
	splitting: true,
	sourcemap: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	loader: {
		'.jpg': 'file',
		'.gif': 'file',
		'.scss': 'file',
		'.svg': 'file',
		'.png': 'file',
	},
} );
