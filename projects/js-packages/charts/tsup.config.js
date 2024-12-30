import path from 'path';
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';

export default defineConfig( {
	entry: [ 'src/index.ts' ],
	format: [ 'cjs', 'esm' ],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: [ 'react' ],
	outDir: 'dist',
	esbuildPlugins: [
		sassPlugin( {
			filter: /\.module\.scss$/,
			transform: postcssModules( {
				basedir: path.resolve( __dirname ),
				generateScopedName: '[name]__[local]___[hash:base64:5]',
			} ),
		} ),
		sassPlugin( {
			filter: /\.scss$/,
		} ),
	],
} );
