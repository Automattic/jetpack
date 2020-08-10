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
	TRAVIS_JOB_WEB_URL,
	TRAVIS_BUILD_NUMBER,
	E2E_SLACK_TOKEN,
	E2E_CHANNEL_NAME,
	TRAVIS_PULL_REQUEST,
} = process.env;
const token = E2E_SLACK_TOKEN || config.get( 'slackToken' );
const conversationId = E2E_CHANNEL_NAME || config.get( 'slackChannel' );
const webCli = new WebClient( token );

const repoURL = `https://github.com/${ TRAVIS_REPO_SLUG }`;
const branchName = TRAVIS_PULL_REQUEST_BRANCH !== '' ? TRAVIS_PULL_REQUEST_BRANCH : TRAVIS_BRANCH;
const ccBrbrr = 'cc <@U6NSPV1LY>';

async function sendRequestToSlack( fn ) {
	try {
		return await fn();
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

const createSection = ( text, type = 'mrkdwn' ) => {
	return {
		type: 'section',
		text: {
			type,
			text,
		},
	};
};

export const getFailedTestMessage = ( { name, block, error } ) => {
	let testFailure = '';
	if ( error.name || error.message ) {
		testFailure = error.name + ': ' + error.message;
	}
	const message = [
		createSection( `*TEST FAILED:*
*Test suite*: ${ block }
*Test case*: ${ name }
*Failure reason:* ${ testFailure }
*Travis build:* ${ TRAVIS_BUILD_WEB_URL }
*E2E Job:* ${ TRAVIS_JOB_WEB_URL }
*Github branch:* ${ branchName }
*Github PR URL:* ${ repoURL }/pull/${ TRAVIS_PULL_REQUEST }` ),
	];
	return message;
};

export const getResultMessage = failureCount => {
	let buildInfo = `*BUILD #${ TRAVIS_BUILD_NUMBER } FAILED:*

*Total failures:* ${ failureCount }
*Travis build:* ${ TRAVIS_BUILD_WEB_URL }
*E2E Job:* ${ TRAVIS_JOB_WEB_URL }
*Github branch:* ${ branchName }`;

	if ( TRAVIS_PULL_REQUEST ) {
		buildInfo += `\n*Github PR URL:* ${ repoURL }/pull/${ TRAVIS_PULL_REQUEST }`;
	} else {
		buildInfo += `\n*Github branch URL:* ${ repoURL }/tree/${ branchName }`;
	}

	const message = [
		createSection( buildInfo ),
		createSection( `Build details are threaded :thread:` ),
	];

	if ( TRAVIS_BRANCH === 'master' ) {
		message.push( createSection( ccBrbrr ) );
	}

	return message;
};

export const getSuccessMessage = () => {
	let buildInfo = `*BUILD #${ TRAVIS_BUILD_NUMBER } PASSED:*

*Travis build:* ${ TRAVIS_BUILD_WEB_URL }
*E2E Job:* ${ TRAVIS_JOB_WEB_URL }
*Github branch:* ${ branchName }`;

	if ( TRAVIS_PULL_REQUEST ) {
		buildInfo += `\n*Github PR URL:* ${ repoURL }/pull/${ TRAVIS_PULL_REQUEST }`;
	} else {
		buildInfo += `\n*Github branch URL:* ${ repoURL }/tree/${ branchName }`;
	}

	const message = [ createSection( buildInfo ) ];
	return message;
};

export async function sendMessageToSlack( message, options = {} ) {
	const payload = Object.assign(
		{
			channel: conversationId,
			username: 'Gutenpack testbot',
			icon_emoji: ':gutenpack:',
		},
		options
	);

	if ( typeof message === 'string' ) {
		payload.text = message;
	} else {
		payload.blocks = message;
	}

	// For details, see: https://api.slack.com/methods/chat.postMessage
	return await sendRequestToSlack( async () => await webCli.chat.postMessage( payload ) );
}

export async function sendSnippetToSlack( message, options = {} ) {
	const payload = Object.assign(
		{
			channels: conversationId,
			username: 'Gutenpack testbot',
			icon_emoji: ':gutenpack:',
			content: message,
		},
		options
	);

	return await sendRequestToSlack( async () => await webCli.files.upload( payload ) );
}

export async function sendFileToSlack( filePath, options = {} ) {
	const payload = Object.assign(
		{
			filename: filePath,
			file: createReadStream( filePath ),
			channels: conversationId,
		},
		options
	);

	// For details, see: https://api.slack.com/methods/files.upload
	return await sendRequestToSlack( async () => await webCli.files.upload( payload ) );
}
