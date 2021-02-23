const PlaywrightEnvironment = require( 'jest-playwright-preset/lib/PlaywrightEnvironment' ).default;
const fs = require( 'fs' );

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
				console.log( `\n\t> START TEST ${ testName }` );
				// await this.storeVideoFileName( testName );
				break;
			case 'hook_start':
				console.log( `\n\t> START ${ hookName }` );
				// await this.storeVideoFileName( hookName );
				break;
			case 'hook_success':
				console.log( `\n\t> DONE ${ hookName }` );
				break;
			case 'hook_failure':
				console.log( `\t> HOOK ${ hookName } FAILED!\n` );
				console.log( event.hook.errors );
				await this.saveScreenshot( hookName );
				await this.storeVideoFileName( hookName );
				await this.logHTML( hookName );
				await this.logToSlack( event.hook.parent.name, event.hook.type, event.hook.errors );
				break;
			case 'test_fn_start':
				break;
			case 'test_fn_success':
				break;
			case 'test_fn_failure':
				console.log( `\t> TEST ${ testName } FAILED\n` );
				console.log( event.test.errors );
				break;
			case 'test_done':
				console.log( `\t> TEST DONE ${ testName }\n` );
				if ( event.test.errors.length > 0 ) {
					await this.saveScreenshot( testName );
					await this.storeVideoFileName( testName );
					await this.logHTML( testName );
					await this.logToSlack( event.test.parent.name, event.test.name, event.test.errors );
				}
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

	async writeFailureToSlackLog( failureObj ) {
		fs.appendFileSync( `output/logs/e2e-slack.log`, JSON.stringify( failureObj ) );
	}

	// We cannot use the old logger.slack here because: https://github.com/facebook/jest/pull/8751
	// As a temp workaround create failure objects and write them in the log file using fs
	// todo We should rewrite the Slack reporting and change the approach
	async logToSlack( block, name, errors ) {
		const failure = {
			type: 'failure',
			level: 'slack',
			block,
			name,
			message: '',
			error: errors,
		};

		await this.writeFailureToSlackLog( `${ failure }\n` );
	}

	async saveScreenshot( fileName ) {
		if ( this.global.page ) {
			const ts = new Date().toISOString();
			fileName = `${ fileName }_${ ts }`;
			fileName = `${ fileName.replace( /\W/g, '_' ) }.png`;
			const path = require( 'path' );
			const filePath = path.resolve( `output/screenshots/${ fileName }` );
			this.global.page.screenshot( { path: filePath } );

			const failure = {
				type: 'file',
				level: 'slack',
				timestamp: ts,
				message: filePath,
			};

			await this.writeFailureToSlackLog( failure );
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
			const bodyHTML = await this.global.page.evaluate( () => document.body.innerHTML );
			const fileName = `${ filePath.replace( /\W/g, '_' ) }.html`;
			fs.writeFileSync( `output/logs/${ fileName }`, bodyHTML );
		}
	}
}

module.exports = PlaywrightCustomEnvironment;
