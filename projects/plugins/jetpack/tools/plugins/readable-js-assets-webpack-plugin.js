/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const json2php = require( 'json2php' );

class AddReadableJsAssetsWebpackPlugin {
	constructor( { assetFileName } ) {
		this.mapping = {};
		this.assetFileName = assetFileName;
	}
	extractUnminifiedFiles( compilation ) {
		const files = Array.from( compilation.chunks ).flatMap( chunk => Array.from( chunk.files ) );
		compilation.unminifiedAssets = files
			.map( file => {
				const asset = compilation.assets[ file ];
				const pos = file.indexOf( '?' );
				const baseFileName = pos > 0 ? file.substring( 0, pos ) : file;
				// Length of hash has to be 16 or longer, the default value is 20.
				const unminifiedFile = baseFileName.replace( /(-[a-z0-9]{20})?\.min\.js$/, '.js' );
				if ( this.needsMapping( baseFileName ) ) {
					this.mapping[ baseFileName ] = unminifiedFile;
				}
				return [ unminifiedFile, asset.source() ];
			} )
			.filter( val => val );
	}
	async writeUnminifiedFiles( compilation ) {
		await fs.promises.writeFile(
			path.join(
				compilation.options.output.path,
				`${ this.assetFileName }.translations-mapping.php`
			),
			this.stringify( this.mapping )
		);
		for ( const [ file, source ] of compilation.unminifiedAssets ) {
			await fs.promises.writeFile(
				path.join( compilation.options.output.path, file ),
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
	stringify( asset ) {
		return `<?php return ${ json2php( JSON.parse( JSON.stringify( asset ) ) ) };`;
	}
	needsMapping( file ) {
		return /-[a-z0-9]{20}\.min\.js$/.test( file );
	}
}

module.exports = AddReadableJsAssetsWebpackPlugin;
