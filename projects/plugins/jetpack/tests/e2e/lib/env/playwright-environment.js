const NodeEnvironment = require( 'jest-environment-node' );
const { chromium } = require( 'playwright' );
const os = require( 'os' );
const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const logger = require( '../logger' ).default;
const pwContextOptions = require( '../../playwright.config' ).pwContextOptions;
const { logDebugLog, fileNameFormatter, logAccessLog } = require( '../utils-helper' );
const { E2E_DEBUG, PAUSE_ON_FAILURE } = process.env;

const DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

class PlaywrightCustomEnvironment extends NodeEnvironment {
	async setup() {
		await super.setup();

		// Connect to server (launched in global-setup)
		const wsEndpoint = fs.readFileSync( path.join( DIR, 'wsEndpoint' ), 'utf8' );
		if ( ! wsEndpoint ) {
			throw new Error( 'wsEndpoint not found' );
		}

		this.global.browser = await chromium.connect( {
			wsEndpoint,
		} );

		// Create a new browser context
		await this.newContext();
	}

	async teardown() {
		await super.teardown();
		logger.debug( 'Closing browser context' );
		await this.global.context.close();
	}

	async handleTestEvent( event ) {
		let eventName;

		if ( event.test ) {
			eventName = `${ event.test.parent.name } - ${ event.test.name }`;
		} else if ( event.hook ) {
			eventName = `${ event.hook.type } - ${ event.hook.parent.name }`;
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
				await this.newPage( eventName );
				break;
			case 'hook_start':
				logger.info( `START: ${ eventName }` );
				if ( event.hook.type === 'beforeAll' ) {
					await this.newPage( eventName );
				}
				break;
			case 'hook_success':
				logger.info( chalk.green( `SUCCESS: ${ eventName }` ) );
				if ( event.hook.type === 'beforeAll' ) {
					await this.closePage();
				}
				break;
			case 'hook_failure':
				logger.info( chalk.red( `HOOK FAILED: ${ eventName }` ) );
				await this.onFailure( eventName, event.hook.parent.name, event.hook.type, event.error );
				if ( event.hook.type === 'beforeAll' ) {
					await this.closePage();
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
				await this.closePage();
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

	async newContext() {
		// // todo we need to set a custom user agent!

		this.global.context = await this.global.browser.newContext( pwContextOptions );
		this.global.context.on( 'page', page => this.onNewPage( page ) );
		this.global.context.on( 'close', () => this.onContextClose() );

		// This will store the video files paths for each page in the current context
		// We want to make sure it's empty when the context gets created
		this.global.videoFiles = {};
	}

	async newPage( eventName = '' ) {
		this.global.page = await this.global.context.newPage();
		// Even though this was already called by the page opened event
		// we're calling it again with an event name to give the video file a nice name
		await this.saveVideoFilePathsForPage( this.global.page, eventName );
	}

	async onNewPage( page ) {
		logger.debug( chalk.blueBright( 'New page created' ) );

		// Observe console logging
		page.on( 'console', message => {
			const type = message.type();
			if ( ! [ 'warning', 'error' ].includes( type ) ) {
				return;
			}

			const text = message.text();

			// An exception is made for _blanket_ deprecation warnings: Those
			// which log regardless of whether a deprecated feature is in use.
			if ( text.includes( 'This is a global warning' ) ) {
				return;
			}

			// A chrome advisory warning about SameSite cookies is informational
			// about future changes, tracked separately for improvement in core.
			//
			// See: https://core.trac.wordpress.org/ticket/37000
			// See: https://www.chromestatus.com/feature/5088147346030592
			// See: https://www.chromestatus.com/feature/5633521622188032
			if ( text.includes( 'A cookie associated with a cross-site resource' ) ) {
				return;
			}

			// Viewing posts on the front end can result in this error, which
			// has nothing to do with Gutenberg.
			if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
				return;
			}

			// As of WordPress 5.3.2 in Chrome 79, navigating to the block editor
			// (Posts > Add New) will display a console warning about
			// non - unique IDs.
			// See: https://core.trac.wordpress.org/ticket/23165
			if ( text.includes( 'elements with non-unique id #_wpnonce' ) ) {
				return;
			}

			if ( text.includes( 'is deprecated' ) ) {
				return;
			}

			logger.debug( `CONSOLE: ${ type.toUpperCase() }: ${ text }` );
		} );

		// const userAgent = await page.evaluate( () => navigator.userAgent );
		// logger.info( chalk.blueBright( `New page created with user agent: ${ userAgent }` ) );

		await this.saveVideoFilePathsForPage( page );
	}

	async closePage() {
		logger.debug( chalk.blueBright( 'Closing page' ) );
		await this.global.page.close();
	}

	async saveVideoFilePathsForPage( page, eventName = '' ) {
		// Save the pair of the current page videoPath and the event name
		// to use later in video files renaming

		try {
			const srcVideoPath = await page.video().path();
			const ext = path.extname( srcVideoPath );
			const dir = path.dirname( srcVideoPath );
			this.global.videoFiles[ srcVideoPath ] = path.join(
				dir,
				`${ fileNameFormatter( eventName ) }${ ext }`
			);
		} catch ( error ) {
			logger.error( `Cannot get page's video file path! Is video capture active? \n ${ error }` );
		}
	}

	async onContextClose() {
		// Rename video files. This can only be done after browser context is closed
		// Each page has its own video file
		for ( const [ src, dst ] of Object.entries( this.global.videoFiles ) ) {
			try {
				fs.renameSync( src, dst );
				logger.debug( `Video file saved as ${ dst }` );
			} catch ( error ) {
				logger.error( `Renaming video file failed! \n ${ error }` );
			}
		}
	}

	/**
	 * Series of actions to be performed when a failure is detected
	 *
	 * @param {string} eventFullName the event in which the failure occurred (e.g. test name)
	 * @param {string} parentName the event's parent name (e.g. describe block name)
	 * @param {string} eventName the event in which the failure occurred (e.g. test name)
	 * @param {Object} error the error object that triggered the failure
	 * @return {Promise<void>}
	 */
	async onFailure( eventFullName, parentName, eventName, error ) {
		logger.error( chalk.red( `FAILURE: ${ error }` ) );
		await this.saveScreenshot( eventFullName );
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
		for ( const page of this.global.context.pages() ) {
			try {
				fileName = `${ fileName }.png`;
				const filePath = path.resolve( `output/screenshots/${ fileNameFormatter( fileName ) }` );
				await page.screenshot( { path: filePath, fullPage: true } );
				logger.debug( `Screenshot saved: ${ filePath }` );
				logger.slack( { type: 'file', message: filePath } );
			} catch ( error ) {
				logger.error( 'Failed to take screenshot due to: ' );
				logger.error( error );
			}
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
				const filePath = path.resolve( `output/logs/${ fileName }` );
				fs.writeFileSync( filePath, bodyHTML );
				logger.debug( `Page saved: ${ filePath }` );
			} catch ( error ) {
				logger.error( 'Failed to log page HTML due to: ' );
				logger.error( error );
			}
		}
	}
}

module.exports = PlaywrightCustomEnvironment;
