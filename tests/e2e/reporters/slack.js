/**
 * External dependencies
 */
import { IncomingWebhook } from '@slack/webhook';

export const sendFailureMessage = async test => {
	const message = {
		icon_emoji: ':gutenpack:',
		text: test + ' cc <@U6NSPV1LY>',
		username: 'Gutenpack testbot',
	};

	const { E2E_WEBHOOK } = process.env;

	if ( ! E2E_WEBHOOK ) {
		// eslint-disable-next-line no-console
		console.log( 'Slack URL is not set' );
		return false;
	}

	const hook = new IncomingWebhook( E2E_WEBHOOK );

	await hook.send( message );
	// return Promise.resolve();
};

export const registerSlackReporter = () => {
	/**
	 * jasmine reporter does not support async.
	 * So we store the screenshot promise and wait for it before each test
	 */
	// const slackPromise = Promise.resolve();
	// beforeEach( () => slackPromise );
	// afterAll( () => slackPromise );

	const tests = [];

	/**
	 * Send a slack notification on Failed test.
	 * Jest standard reporters run in a separate process so they don't have
	 * access to the page instance. Using jasmine reporter allows us to
	 * have access to the test result, test name and page instance at the same time.
	 */
	jasmine.getEnv().addReporter( {
		specDone: async result => {
			tests.push( result );

			// if ( result.status === 'failed' ) {
			await sendFailureMessage( `FAILED TEST: ${ result.fullName }` );
			// }
		},
	} );
};
