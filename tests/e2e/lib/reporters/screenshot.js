/**
 * External dependencies
 */
import path from 'path';
import mkdirp from 'mkdirp';
import config from 'config';

const screenshotsPath = path.resolve( config.get( 'testOutputDir' ), 'screenshots' );
const toFilename = s => s.replace( /[^a-z0-9.-]+/gi, '-' );

export async function takeScreenshot( currentBlock, name ) {
	const fileName = toFilename( `${ new Date().toISOString() }-${ currentBlock }-${ name }.png` );
	const filePath = path.join( screenshotsPath, fileName );
	mkdirp.sync( screenshotsPath );

	await page.screenshot( {
		path: filePath,
		fullPage: true,
	} );

	return filePath;
}
