const path = require( 'path' );
const config = require( 'config' );
const logger = require( '../logger' );
const fs = require( 'fs' );
const { ContentType } = require( 'jest-circus-allure-environment' );
const { fileNameFormatter } = require( '../helpers' );

/**
 * Takes a screenshot of the given page
 *
 * @param {page}   page     Playwright page instance
 * @param {string} fileName screenshot file name
 * @param {Object} allure   instance of allure reporter
 * @return {Promise<void>}
 */
async function takeScreenshot( page, fileName, allure ) {
	let filePath;

	try {
		filePath = path.resolve(
			config.get( 'dirs.screenshots' ),
			`${ fileNameFormatter( fileName ) }.png`
		);
		await page.screenshot( { path: filePath, fullPage: true } );
		logger.debug( `Screenshot saved: ${ filePath }` );

		if ( allure ) {
			await allure.attachment( fileName, fs.readFileSync( filePath ), ContentType.PNG );
		}
	} catch ( error ) {
		logger.error( `Failed to save screenshot: ${ error }` );
	}

	return filePath;
}

module.exports = { takeScreenshot };
