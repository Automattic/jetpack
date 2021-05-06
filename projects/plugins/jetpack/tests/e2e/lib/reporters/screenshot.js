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
 * @param {boolean} logToSlack whether to also log this file to slack log
 * @return {Promise<void>}
 */
async function takeScreenshot( page, fileName, logToSlack = false ) {
	try {
		const filePath = path.resolve(
			config.get( 'dirs.screenshots' ),
			`${ fileNameFormatter( fileName ) }.png`
		);
		await page.screenshot( { path: filePath, fullPage: true } );
		logger.debug( `Screenshot saved: ${ filePath }` );
		if ( logToSlack ) {
			logger.slack( { type: 'file', message: filePath } );
		}
	} catch ( error ) {
		logger.error( `Failed to save screenshot: ${ error }` );
	}
}

module.exports = { takeScreenshot };
