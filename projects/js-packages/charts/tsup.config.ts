import { sassPlugin, postcssModules } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';
import pkg from './package.json';

// Extract entries from package exports
const entry = Object.values( pkg.exports )
	.map( $export => ( typeof $export === 'object' ? $export[ 'jetpack:src' ] : '' ) )
	.filter( ( path ): path is string => Boolean( path ) );

export default defineConfig( {
	entry,
	clean: true,
	splitting: true,
	sourcemap: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	noExternal: [ '@wordpress/ui' ],
	loader: {
		'.jpg': 'file',
		'.gif': 'file',
		'.svg': 'file',
		'.png': 'file',
	},
	esbuildPlugins: [
		sassPlugin( {
			filter: /\.module\.(css|scss)$/,
			embedded: true,
			transform: postcssModules( {
				generateScopedName: 'a8ccharts-[contenthash:base64:6]',
			} ),
		} ),
	],
} );
