/**
 * External dependencies
 */
const path = require( 'path' );
const config = require( 'config' );
const logger = require( '../logger' );
const { fileNameFormatter } = require( '../utils-helper' );

/**
 * Takes a screenshot of the given page
 *
 * @param {page} page Playwright page type
 * @param {string} fileName screenshot file name
 * @return {Promise<void>}
 */
async function takeScreenshot( page, fileName ) {
	try {
		const filePath = path.resolve(
			config.get( 'dirs.screenshots' ),
			`${ fileNameFormatter( fileName ) }.png`
		);
		await page.screenshot( { path: filePath, fullPage: true } );
		logger.debug( `Screenshot saved: ${ filePath }` );
	} catch ( error ) {
		logger.error( `Failed to save screenshot: ${ error }` );
	}
}

module.exports = { takeScreenshot };
