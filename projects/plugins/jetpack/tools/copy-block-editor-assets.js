const fs = require( 'fs/promises' );
const path = require( 'path' );
const { glob } = require( 'glob' );

const PLUGIN_NAME = 'CopyEditorAssetsPlugin';
const EXPORT_PATH = '_inc/blocks/editor-assets';

module.exports = class CopyBlockEditorAssetsPlugin {
	apply( compiler ) {
		const logger = compiler.getInfrastructureLogger( PLUGIN_NAME );
		logger.log( 'Starting copy of block editor assets' );
		compiler.hooks.emit.tapPromise( 'CopyBlockEditorAssetsPlugin', async () => {
			for ( const file of await glob( 'extensions/blocks/**/block-editor-assets.json' ) ) {
				const resources = require( path.resolve( file ) );
				for ( const resource of resources ) {
					const source = path.resolve( resource.file );
					const filename = path.basename( source, path.extname( source ) );
					const ext = path.extname( source );
					const dest = `${ path.resolve( EXPORT_PATH ) }/${ filename }-${
						resource.version
					}${ ext }`;

					await fs.mkdir( path.resolve( EXPORT_PATH ), { recursive: true } );
					await fs.copyFile( source, dest );
				}
			}
		} );
	}
};
