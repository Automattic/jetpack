const NodeEnvironment = require( 'jest-environment-node' );
const { chromium } = require( 'playwright' );
const os = require( 'os' );
const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const logger = require( '../logger' ).default;
const pwContextOptions = require( '../../playwright.config' ).pwContextOptions;
const { logDebugLog, fileNameFormatter, logAccessLog } = require( '../utils-helper' );
const { takeScreenshot } = require( '../reporters/screenshot' );
const config = require( 'config' );
const { E2E_DEBUG, PAUSE_ON_FAILURE } = process.env;

const TMP_DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

class PlaywrightCustomEnvironment extends NodeEnvironment {
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

		this.global.siteUrl = fs
			.readFileSync( config.get( 'temp.tunnels' ), 'utf8' )
			.replace( 'http:', 'https:' );
	}

	async teardown() {
		await super.teardown();
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

		await this.saveVideoFilePathsForPage( page );
	}

	async closePage() {
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
	 * Takes screenshots of all open pages and saves
	 *
	 * @param {string} fileName screenshot file name
	 * @return {Promise<void>}
	 */
	async saveScreenshot( fileName ) {
		for ( const page of this.global.context.pages() ) {
			await takeScreenshot( page, fileName, true );
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

module.exports = PlaywrightCustomEnvironment;
