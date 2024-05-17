import path from 'path';
import config from 'config';
import logger from '../logger.js';
import fs from 'fs';
import { fileNameFormatter } from '../helpers/utils-helper.js';

/**
 * Takes a screenshot of the given page
 *
 * @param {page}   page     Playwright page instance
 * @param {string} fileName screenshot file name
 * @param {Object} allure   instance of allure reporter
 * @return {Promise<void>}
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
