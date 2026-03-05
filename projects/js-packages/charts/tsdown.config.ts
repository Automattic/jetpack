import { readFileSync } from 'node:fs';
import postcss from 'rollup-plugin-postcss';
import * as sass from 'sass-embedded';
import { defineConfig } from 'tsdown';

const pkg = JSON.parse( readFileSync( './package.json', 'utf-8' ) );

// Extract entries from package exports
const entry = Object.values( pkg.exports )
	.map( ( $export: unknown ) =>
		typeof $export === 'object' && $export !== null
			? ( $export as Record< string, string > )[ 'jetpack:src' ]
			: ''
	)
	.filter( ( path ): path is string => Boolean( path ) );

export default defineConfig( {
	entry,
	clean: true,
	sourcemap: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	noExternal: [ '@wordpress/ui' ],
	// Acknowledge that @wordpress/ui dependencies are intentionally bundled
	inlineOnly: false,
	plugins: [
		postcss( {
			modules: {
				generateScopedName: 'a8ccharts-[hash:base64:6]',
			},
			extract: true,
			sourceMap: true,
			loaders: [
				{
					name: 'sass',
					test: /\.(sass|scss)$/,
					process: ( { code }: { code: string } ) => {
						const result = sass.compileString( code, {
							syntax: 'scss',
						} );
						return { code: result.css };
					},
				},
			],
		} ),
	],
} );
