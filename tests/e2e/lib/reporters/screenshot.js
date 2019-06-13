/**
 * External dependencies
 */
import path from 'path';
import mkdirp from 'mkdirp';
import { writeFile } from 'fs';

const screenshotsPath = path.resolve( __dirname, '../../reports/screenshots' );
const toFilename = s => s.replace( /[^a-z0-9.-]+/gi, '_' );
let currentTest = '';
let currentScreenshot = null;

const saveScreenshot = async ( screenshot, testName ) => {
	await mkdirp( screenshotsPath );
	const fileName = toFilename( `${ new Date().toISOString() }_${ testName }_screenshot.png` );
	const filePath = path.join( screenshotsPath, fileName );
	await writeFile( filePath, screenshot );
	return filePath;
};

afterEach( async () => {
	currentScreenshot = await page.screenshot();
} );

export const registerScreenshotReporter = () => {
	/**
	 * Take a screenshot on Failed test.
	 * Jest standard reporters run in a separate process so they don't have
	 * access to the page instance. Using jasmine reporter allows us to
	 * have access to the test result, test name and page instance at the same time.
	 */
	jasmine.getEnv().addReporter( {
		specStarted: ( { fullName } ) => {
			currentTest = fullName;
			currentScreenshot = null;
		},
		specDone: async ( { status, fullName } ) => {
			if ( status === 'failed' ) {
				if ( currentScreenshot ) {
					try {
						const filePath = await saveScreenshot( currentScreenshot, currentTest );
						console.error( `FAILED ${ fullName }: screenshot @ ${ filePath }` );
					} catch ( e ) {
						console.error( `FAILED ${ fullName }: could not save screenshot.`, e );
					}
				} else {
					console.error( `FAILED ${ fullName }: sadly, no screenshot could be taken.` );
				}
			}
		},
	} );
};
