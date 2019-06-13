/**
 * External dependencies
 */
import { IncomingWebhook } from '@slack/webhook';

const {
	E2E_WEBHOOK,
	CI,
	TRAVIS_BRANCH,
	TRAVIS_REPO_SLUG,
	TRAVIS_PULL_REQUEST_BRANCH,
	TRAVIS_BUILD_WEB_URL,
} = process.env;

const getMessage = testName => {
	if ( ! CI ) {
		return testName;
	}
	const branchName = TRAVIS_PULL_REQUEST_BRANCH !== '' ? TRAVIS_PULL_REQUEST_BRANCH : TRAVIS_BRANCH;
	const ccBrbrr = 'cc <@U6NSPV1LY>';
	let message;
	message = `TEST FAILED: ${ testName }\n`;
	message += `Travis build: ${ TRAVIS_BUILD_WEB_URL }\n`;
	message += `Github branch: https://github.com/${ TRAVIS_REPO_SLUG }/${ branchName }\n`;
	message += ccBrbrr + '\n';
	return message;
};

export const sendFailureMessage = async test => {
	const message = {
		icon_emoji: ':gutenpack:',
		text: getMessage( test ),
		username: 'Gutenpack testbot',
	};

	if ( ! E2E_WEBHOOK ) {
		console.log( 'Slack URL is not set' );
		console.log( JSON.stringify( message ) );
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

			if ( result.status === 'failed' ) {
				await sendFailureMessage( `FAILED TEST: ${ result.fullName }` );
			}
		},
	} );
};
