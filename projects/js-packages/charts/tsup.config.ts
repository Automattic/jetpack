import babel from 'esbuild-plugin-babel';
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
	noExternal: [ '@wordpress/ui', 'fast-deep-equal' ],
	loader: {
		'.jpg': 'file',
		'.gif': 'file',
		'.svg': 'file',
		'.png': 'file',
	},
	esbuildPlugins: [
		babel( {
			filter: /\.tsx$/,
			config: {
				presets: [
					'@babel/preset-typescript',
					[ '@babel/preset-react', { runtime: 'automatic' } ],
				],
				plugins: [ [ 'react-remove-properties', { properties: [ 'data-testid' ] } ] ],
			},
		} ),
		sassPlugin( {
			filter: /\.module\.(css|scss)$/,
			embedded: true,
			transform: postcssModules( {
				generateScopedName: 'a8ccharts-[contenthash:base64:6]',
			} ),
		} ),
	],
} );
