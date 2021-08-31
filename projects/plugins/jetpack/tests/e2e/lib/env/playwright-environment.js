const { chromium } = require( 'playwright' );
const os = require( 'os' );
const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const logger = require( '../logger' );
const pwContextOptions = require( '../../playwright.config' ).pwContextOptions;
const { fileNameFormatter, resolveSiteUrl, isLocalSite } = require( '../utils-helper' );
const { takeScreenshot } = require( '../reporters/screenshot' );
const config = require( 'config' );
const { ContentType } = require( 'jest-circus-allure-environment' );
const AllureNodeEnvironment = require( 'jest-circus-allure-environment' ).default;
const { E2E_DEBUG, PAUSE_ON_FAILURE } = process.env;

const TMP_DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

class PlaywrightEnvironment extends AllureNodeEnvironment {
	async setup() {
		await super.setup();

		// Connect to server (launched in global-setup)
		const wsEndpoint = fs.readFileSync( path.join( TMP_DIR, 'wsEndpoint' ), 'utf8' );
		if ( ! wsEndpoint ) {
			throw new Error( 'wsEndpoint not found' );
		}

		this.global.browser = await chromium.connect( {
			wsEndpoint,
		} );

		// Create a new browser context
		await this.newContext();

		this.global.siteUrl = resolveSiteUrl();
		this.global.isLocalSite = isLocalSite();
	}

	async teardown() {
		await super.teardown();
		await this.global.context.close();
	}

	async handleTestEvent( event, state ) {
		let eventName;

		if ( event.hook ) {
			eventName = `${ event.hook.type } - ${ event.hook.parent.name }`;
		} else if ( event.test ) {
			eventName = `${ event.test.parent.name } - ${ event.test.name }`;
		} else {
			eventName = event.name;
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
				await this.newPage();
				break;
			case 'hook_start':
				logger.info( `START: ${ eventName }` );
				if ( event.hook.type === 'beforeAll' ) {
					await this.newPage();
				}
				break;
			case 'hook_success':
				logger.info( chalk.green( `SUCCESS: ${ eventName }` ) );
				if ( event.hook.type === 'beforeAll' ) {
					await this.closePage( eventName, false );
				}
				break;
			case 'hook_failure':
				logger.info( chalk.red( `HOOK FAILED: ${ eventName }` ) );
				await this.onFailure( eventName, event.hook.parent.name, event.hook.type, event.error );
				if ( event.hook.type === 'beforeAll' ) {
					await this.closePage( eventName, true );
				}
				break;
			case 'test_fn_start':
				logger.info( `START TEST: ${ eventName }` );
				break;
			case 'test_fn_success':
				logger.info( chalk.green( `TEST PASSED: ${ eventName }` ) );
				break;
			case 'test_fn_failure':
				logger.info( chalk.red( `FAILED TEST: ${ eventName }` ) );
				await this.onFailure( eventName, event.test.parent.name, event.test.name, event.error );
				break;
			case 'test_done':
				await this.closePage( eventName, event.test.errors.length > 0 );
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

		// important to be at the end otherwise videos won't get attached correctly in Allure reports
		// allure reporter closes the tests events in super method and this need to happen
		// after we close pages and save the videos or other resources we need attached
		await super.handleTestEvent( event, state );
	}

	async newContext() {
		// // todo we need to set a custom user agent!

		this.global.context = await this.global.browser.newContext( pwContextOptions );
		this.global.context.on( 'page', page => this.onNewPage( page ) );
	}

	async newPage() {
		this.global.page = await this.global.context.newPage();
	}

	async onNewPage( page ) {
		// Observe console logging
		page.on( 'console', message => {
			const type = message.type();

			// Ignore debug messages
			if ( ! [ 'warning', 'error' ].includes( type ) ) {
				return;
			}

			const text = message.text();

			// Ignore messages
			for ( const subString of config.consoleIgnore ) {
				if ( text.includes( subString ) ) {
					return;
				}
			}

			logger.debug( `CONSOLE: ${ type.toUpperCase() }: ${ text }` );
		} );

		page.on( 'pageerror', exception => {
			logger.debug( `Page error: "${ exception }"` );
		} );

		page.on( 'requestfailed', request => {
			logger.debug( `Request failed: ${ request.url() }  ${ request.failure().errorText }` );
		} );
	}

	async closePage( eventName, saveVideo = true ) {
		await this.global.page.close();

		if ( this.global.page.video() && saveVideo ) {
			const videoName = fileNameFormatter( `${ eventName }.webm`, true );
			const videoPath = `${ config.get( 'dirs.videos' ) }/${ videoName }`;

			try {
				await this.global.page.video().saveAs( videoPath );
				logger.debug( `Video file saved: ${ videoPath }` );
			} catch ( error ) {
				logger.error( `There was an error saving the video file!\n${ error }` );
			}

			try {
				await this.global.allure.attachment(
					videoName,
					fs.readFileSync( videoPath ),
					ContentType.WEBM
				);
				logger.debug( `Video file attached to report` );
			} catch ( error ) {
				logger.error( `There was an error attaching the video to test report!\n${ error }` );
			}
		}
	}

	/**
	 * Series of actions to be performed when a failure is detected
	 *
	 * @param {string} eventFullName the event in which the failure occurred (e.g. test name)
	 * @param {string} parentName    the event's parent name (e.g. describe block name)
	 * @param {string} eventName     the event in which the failure occurred (e.g. test name)
	 * @param {Object} error         the error object that triggered the failure
	 * @return {Promise<void>}
	 */
	async onFailure( eventFullName, parentName, eventName, error ) {
		logger.error( chalk.red( `FAILURE: ${ error }` ) );

		await this.saveScreenshots( eventFullName );
		await this.logHTML( eventFullName );

		if ( E2E_DEBUG && PAUSE_ON_FAILURE && this.global.page ) {
			await this.global.page.pause();
		}
	}

	/**
	 * Takes screenshots of all open pages and saves
	 *
	 * @param {string} fileName screenshot file name
	 * @return {Promise<void>}
	 */
	async saveScreenshots( fileName ) {
		for ( const page of this.global.context.pages() ) {
			await takeScreenshot( page, fileName, this.global.allure );
		}
	}

	/**
	 * Save the html of the current page into a file
	 *
	 * @param {string} fileName
	 * @return {Promise<void>}
	 */
	async logHTML( fileName ) {
		for ( const page of this.global.context.pages() ) {
			try {
				const bodyHTML = await page.evaluate( () => document.body.innerHTML );
				fileName = `${ fileNameFormatter( fileName ) }.html`;
				const filePath = path.resolve( config.get( 'dirs.logs' ), fileName );
				fs.writeFileSync( filePath, bodyHTML );
				logger.debug( `Page saved: ${ filePath }` );
			} catch ( error ) {
				logger.error( 'Failed to log page HTML due to: ' );
				logger.error( error );
			}
		}
	}
}

module.exports = PlaywrightEnvironment;
