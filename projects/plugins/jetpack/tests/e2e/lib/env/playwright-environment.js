const PlaywrightEnvironment = require( 'jest-playwright-preset/lib/PlaywrightEnvironment' ).default;

class PlaywrightCustomEnvironment extends PlaywrightEnvironment {
	async setup() {
		await super.setup();
	}

	async teardown() {
		await super.teardown();
	}

	async handleTestEvent( event ) {
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
				break;
			case 'hook_start':
				console.log( `\n\t> START ${ hookName }` );
				break;
			case 'hook_success':
				break;
			case 'hook_failure':
				console.log( `\t> HOOK ${ hookName } FAILED!\n` );
				await this.saveScreenshot( hookName );
				break;
			case 'test_fn_start':
				break;
			case 'test_fn_success':
				break;
			case 'test_fn_failure':
				console.log( `\t> TEST ${ testName } FAILED\n` );
				break;
			case 'test_done':
				console.log( `\t> TEST DONE ${ testName }\n` );
				if ( event.test.errors.length > 0 ) {
					await this.saveScreenshot( testName );
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

	async saveScreenshot( fileName ) {
		if ( this.global.page ) {
			this.global.page.screenshot( {
				path: `output/screenshots/${ fileName.replace( /\W/g, '_' ) }.png`,
			} );
		}
	}
}

module.exports = PlaywrightCustomEnvironment;
