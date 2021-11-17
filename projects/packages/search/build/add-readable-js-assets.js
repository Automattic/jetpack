/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Returns the AddReadableJsAssetsPlugin that outputs unminified and unhashed JS assets.
 * The plugin now only works for Search assets, i.e. asset file name pattern /(\.[a-f0-9]{20})?\.min\.js$/
 *
 * Forked from: https://github.com/WordPress/gutenberg/blob/b1fd6b2ce6221f1297da78b6c48aeee56130501b/packages/readable-js-assets-webpack-plugin/index.js
 *
 * 1. Our translations pipeline ignores all files suffixed with `.min.js`.
 * 2. This plugin will generate a non-minified JS file for each `.min.js` asset.
 * 3. This plugin will also strip the `[hash]`/`[contentHash]` from the non-minified
 * JS file, enabling inlining translations within PHP. This is essential for WPCOM,
 * where we generate unique hash/contentHash for every PR deployment.
 *
 */
class AddReadableJsAssetsPlugin {
	extractUnminifiedFiles( compilation ) {
		const files = Array.from( compilation.chunks ).flatMap( chunk => Array.from( chunk.files ) );
		compilation.unminifiedAssets = files.map( file => {
			const asset = compilation.assets[ file ];
			// Remove the hash in chunk file names for the sake of translations loading from PHP.
			// The setting here should be aligned with the `output-chunk-filename`
			const unminifiedFile = file.replace( /(\.[a-f0-9]{20})?\.min\.js$/, '.js' );
			return [ unminifiedFile, asset.source() ];
		} );
	}
	async writeUnminifiedFiles( compilation ) {
		for ( const [ file, source ] of compilation.unminifiedAssets ) {
			await fs.promises.writeFile(
				path.join( compilation.options.output.path, file ),
				( file.toLowerCase().endsWith( '.js' ) ? '/* eslint-disable */\n' : '' ) +
					source.replace( /\r\n/g, '\n' )
			);
		}
	}
	apply( compiler ) {
		compiler.hooks.compilation.tap( this.constructor.name, compilation => {
			compilation.hooks.additionalAssets.tap( this.constructor.name, () =>
				this.extractUnminifiedFiles( compilation )
			);
		} );
		compiler.hooks.afterEmit.tapPromise( this.constructor.name, compilation =>
			this.writeUnminifiedFiles( compilation )
		);
	}
}

module.exports = AddReadableJsAssetsPlugin;
