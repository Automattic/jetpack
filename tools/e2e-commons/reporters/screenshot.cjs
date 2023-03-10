const path = require( 'path' );
const config = require( 'config' );
const logger = require( '../logger.cjs' );
const fs = require( 'fs' );
const { fileNameFormatter } = require( '../helpers/utils-helper.cjs' );

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
			await allure.attachment( fileName, fs.readFileSync( filePath ), 'png' );
		}
	} catch ( error ) {
		logger.error( `Failed to save screenshot: ${ error }` );
	}

	return filePath;
}

module.exports = { takeScreenshot };
