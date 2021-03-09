const PlaywrightEnvironment = require( 'jest-playwright-preset/lib/PlaywrightEnvironment' ).default;
const fs = require( 'fs' );
const logger = require( '../logger' ).default;
const { logDebugLog, logAccessLog } = require( '../utils-helper' );
const { E2E_DEBUG, PAUSE_ON_FAILURE } = process.env;

class PlaywrightCustomEnvironment extends PlaywrightEnvironment {
	async setup() {
		await super.setup();
	}

	async teardown() {
		await super.teardown();
	}

	async handleTestEvent( event ) {
		await super.handleTestEvent( event );

		let testName = 'unknown_test';
		let hookName = 'unknown_hook';

		if ( event.test ) {
			testName = `${ event.test.parent.name } - ${ event.test.name }`;
		}

		if ( event.hook ) {
			hookName = `${ event.hook.type } - ${ event.hook.parent.name }`;
		}

		switch ( event.name ) {
			case 'setup':
				break;
			case 'add_hook':
				break;
			case 'add_test':
				break;
			case 'run_start':
				break;
			case 'test_skip':
				break;
			case 'test_todo':
				break;
			case 'start_describe_definition':
				break;
			case 'finish_describe_definition':
				break;
			case 'run_describe_start':
				break;
			case 'test_start':
				logger.info( `START TEST: ${ testName }` );
				// await this.storeVideoFileName( testName );
				break;
			case 'hook_start':
				logger.info( `START: ${ hookName }` );
				// await this.storeVideoFileName( hookName );
				break;
			case 'hook_success':
				logger.info( `SUCCESS: ${ hookName }` );
				break;
			case 'hook_failure':
				logger.info( `HOOK FAILED: ${ hookName }` );
				await this.onFailure( testName, event.hook.parent.name, event.hook.type, event.error );
				break;
			case 'test_fn_start':
				break;
			case 'test_fn_success':
				logger.info( `TEST PASSED: ${ testName }` );
				break;
			case 'test_fn_failure':
				logger.info( `FAILED TEST: ${ testName }` );
				await this.onFailure( testName, event.test.parent.name, event.test.name, event.error );
				break;
			case 'test_done':
				logger.info( `TEST DONE: ${ testName }` );
				break;
			case 'run_describe_finish':
				break;
			case 'run_finish':
				break;
			case 'teardown':
				break;
			case 'error':
				break;
			default:
				break;
		}
	}

	async onFailure( eventFullName, parentName, eventName, error ) {
		logger.error( JSON.stringify( error ) );
		await this.saveScreenshot( eventFullName );
		await this.storeVideoFileName( eventFullName );
		await this.logHTML( eventFullName );
		await this.logFailureToSlack( parentName, eventName, error );
		await logDebugLog();
		await logAccessLog();

		if ( E2E_DEBUG && PAUSE_ON_FAILURE && this.global.page ) {
			await this.global.page.pause();
		}
	}

	async logFailureToSlack( block, name, error ) {
		logger.slack( {
			type: 'failure',
			block,
			name,
			error,
		} );
	}

	/**
	 * Takes a screenshot of the current page and saves it
	 *
	 * @param {string} fileName screenshot file name
	 * @return {Promise<void>}
	 */
	async saveScreenshot( fileName ) {
		if ( this.global.page ) {
			const ts = new Date().toISOString();
			fileName = `${ fileName }_${ ts }`;
			fileName = `${ fileName.replace( /\W/g, '_' ) }.png`;
			const path = require( 'path' );
			const filePath = path.resolve( `output/screenshots/${ fileName }` );
			try {
				await this.global.page.screenshot( { path: filePath } );
				logger.slack( { type: 'file', message: filePath } );
			} catch ( error ) {
				logger.error( 'Failed to take screenshot due to: ' );
				logger.error( error );
			}
		}
	}

	/**
	 * Store the name of the video corresponding to the current page in a file so we can rename it later
	 * Store pairs of current name (path) and target name
	 *
	 * @param {string} targetFileName the video file name we will rename it into
	 * @return {Promise<void>}
	 */
	async storeVideoFileName( targetFileName ) {
		if ( this.global.page ) {
			const videoFilePath = await this.global.page.video().path();
			const targetFilePath = `output/videos/${ targetFileName.replace( /\W/g, '_' ) }.webm`;
			fs.appendFileSync( `output/video_files`, `${ videoFilePath }->${ targetFilePath }\n` );
		}
	}

	/**
	 * Save the html of the current page into a file
	 *
	 * @param {string} filePath
	 * @return {Promise<void>}
	 */
	async logHTML( filePath ) {
		if ( this.global.page ) {
			try {
				const bodyHTML = await this.global.page.evaluate( () => document.body.innerHTML );
				const fileName = `${ filePath.replace( /\W/g, '_' ) }.html`;
				fs.writeFileSync( `output/logs/${ fileName }`, bodyHTML );
			} catch ( error ) {
				logger.error( 'Failed to log page HTML due to: ' );
				logger.error( error );
			}
		}
	}
}

module.exports = PlaywrightCustomEnvironment;
