const path = require( 'path' );
const fs = require( 'fs-extra' );
const glob = require( 'glob' );

const PLUGIN_NAME = 'CopyEditorAssetsPlugin';
const EXPORT_PATH = '_inc/blocks/editor-assets';

module.exports = class CopyBlockEditorAssetsPlugin {
	apply( compiler ) {
		const logger = compiler.getInfrastructureLogger( PLUGIN_NAME );
		logger.log( 'Starting copy of block editor assets' );
		compiler.hooks.shouldEmit.tap( 'CopyPlugin_Custom', () => {
			/**
			 * Checks that the export dir exists and creates if not.
			 */
			async function makeDir() {
				await fs.mkdirp( path.resolve( EXPORT_PATH ) );
			}
			/**
			 * Copies an asset file into the assets export folder.
			 *
			 * @param {string} source - The source file to copy.
			 * @param {string} dest - The destination location for file.
			 */
			async function copyFile( source, dest ) {
				await makeDir();
				const source_final = path.resolve( source );
				const dest_final = path.resolve( dest );

				fs.copyFile( source_final, dest_final, function ( err ) {
					if ( err ) {
						logger.error( err );
					}
				} );
			}

			glob( 'extensions/blocks/**/block-editor-assets.json', {}, function ( er, files ) {
				files.forEach( file => {
					const resources = require( path.resolve( file ) );
					resources.forEach( resource => {
						const source = path.resolve( resource.file );
						const filename = path.basename( source, path.extname( source ) );
						const ext = path.extname( source );
						const dest = `${ path.resolve( EXPORT_PATH ) }/${ filename }-${
							resource.version
						}${ ext }`;
						copyFile( source, dest );
					} );
				} );
			} );
		} );
	}
};
