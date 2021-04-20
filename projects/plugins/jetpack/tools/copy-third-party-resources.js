const fs = require( 'fs-extra' );
const glob = require( 'glob' );
const path = require( 'path' );

const PLUGIN_NAME = 'CopyThirdPartyResources';
const EXPORT_PATH = '_inc/blocks/third-party-resources';

module.exports = class CopyThirdPartyResourcesPlugin {
	apply( compiler ) {
		const logger = compiler.getInfrastructureLogger( PLUGIN_NAME );
		logger.log( 'Starting copy of block third party resources' );
		compiler.hooks.shouldEmit.tap( 'CopyPlugin_Custom', () => {
			async function makeDir() {
				await fs.mkdirp( path.resolve( EXPORT_PATH ) );
			}
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

			glob( 'extensions/blocks/**/third-party-resources.json', {}, function ( er, files ) {
				files.forEach( file => {
					const resources = require( path.resolve( file ) );
					resources.forEach( resource => {
						const source = path.resolve( resource.file );
						const filename = path.basename( source );
						const dest = `${ path.resolve( '_inc/blocks/third-party-resources' ) }/${
							resource.version
						}-${ filename }`;
						copyFile( source, dest );
					} );
				} );
			} );
		} );
	}
};
