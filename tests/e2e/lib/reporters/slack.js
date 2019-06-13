/**
 * External dependencies
 */
import { createReadStream } from 'fs';
import { WebClient, ErrorCode } from '@slack/web-api';
import config from 'config';

const {
	TRAVIS_BRANCH,
	TRAVIS_REPO_SLUG,
	TRAVIS_PULL_REQUEST_BRANCH,
	TRAVIS_BUILD_WEB_URL,
	E2E_SLACK_TOKEN,
	E2E_CHANNEL_NAME,
} = process.env;
const token = E2E_SLACK_TOKEN || config.get( 'slackToken' );
const conversationId = E2E_CHANNEL_NAME || config.get( 'slackChannel' );
const webCli = new WebClient( token );

const createSection = ( text, type = 'mrkdwn' ) => {
	return {
		type: 'section',
		text: {
			type,
			text,
		},
	};
};

const getMessage = ( { name, block, error } ) => {
	let testFailure = '';
	if ( error.name || error.message ) {
		testFailure = error.name + ': ' + error.message;
	}
	const testFullName = block + ' :: ' + name;
	const branchName = TRAVIS_PULL_REQUEST_BRANCH !== '' ? TRAVIS_PULL_REQUEST_BRANCH : TRAVIS_BRANCH;
	const ccBrbrr = 'cc <@U6NSPV1LY>';
	const message = [];
	message.push(
		createSection( `*TEST FAILED:* ${ testFullName }
*Failure reason:* ${ testFailure }
*Travis build:* ${ TRAVIS_BUILD_WEB_URL }
*Github branch:* https://github.com/${ TRAVIS_REPO_SLUG }/${ branchName }` )
	);
	message.push( createSection( ccBrbrr ) );
	return message;
};

export async function sendFailedTestMessageToSlack( testResult ) {
	try {
		// For details, see: https://api.slack.com/methods/chat.postMessage
		await webCli.chat.postMessage( {
			blocks: getMessage( testResult ),
			channel: conversationId,
			username: 'Gutenpack testbot',
			icon_emoji: ':gutenpack:',
		} );
	} catch ( error ) {
		// Check the code property and log the response
		if (
			error.code === ErrorCode.PlatformError ||
			error.code === ErrorCode.RequestError ||
			error.code === ErrorCode.RateLimitedError ||
			error.code === ErrorCode.HTTPError
		) {
			console.log( error.data );
		} else {
			// Some other error, oh no!
			console.log(
				'The error occurred does not match an error we are checking for in this block.'
			);
			console.log( error );
		}
	}
}

export async function sendFailedTestScreenshotToSlack( screenshotOfFailedTest ) {
	try {
		// For details, see: https://api.slack.com/methods/files.upload
		await webCli.files.upload( {
			filename: screenshotOfFailedTest,
			file: createReadStream( screenshotOfFailedTest ),
			channels: conversationId,
		} );
	} catch ( error ) {
		// Check the code property and log the response
		if (
			error.code === ErrorCode.PlatformError ||
			error.code === ErrorCode.RequestError ||
			error.code === ErrorCode.RateLimitedError ||
			error.code === ErrorCode.HTTPError
		) {
			console.log( error.data );
		} else {
			// Some other error, oh no!
			console.log(
				'The error occurred does not match an error we are checking for in this block.'
			);
			console.log( error );
		}
	}
}
