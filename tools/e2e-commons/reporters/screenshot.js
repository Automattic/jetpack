import fs from 'fs';
import path from 'path';
import config from 'config';
import { fileNameFormatter } from '../helpers/utils-helper.js';
import logger from '../logger.js';

/**
 * Takes a screenshot of the given page
 *
 * @param {page}   page     - Playwright page instance
 * @param {string} fileName - screenshot file name
 * @param {object} allure   - instance of allure reporter
 * @returns {Promise<void>}
 */
export async function takeScreenshot( page, fileName, allure ) {
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
