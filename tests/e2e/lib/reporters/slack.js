/**
 * External dependencies
 */
import { readFileSync, createReadStream } from 'fs';
import { WebClient, ErrorCode } from '@slack/web-api';
import config from 'config';

const { GITHUB_EVENT_PATH, GITHUB_RUN_ID } = process.env;

const token = config.get( 'slackToken' );
const conversationId = config.get( 'slackChannel' );
const ccBrbrr = 'cc <@U6NSPV1LY>';
const event = JSON.parse( readFileSync( GITHUB_EVENT_PATH, 'utf8' ) );
const runURL = `https://github.com/Automattic/jetpack/runs/${ GITHUB_RUN_ID }?check_suite_focus=true`;
const isPullRequest = !! event.pull_request;
let githubURL;
let branchName;
if ( isPullRequest ) {
	githubURL = event.pull_request.html_url;
	branchName = event.pull_request.head.ref;
} else {
	branchName = event.ref.substr( 11 );
	githubURL = `https://github.com/Automattic/jetpack/tree/${ branchName }`;
}

const webCli = new WebClient( token );

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
*E2E action run:* ${ runURL }
*Github branch:* ${ branchName }
*Github URL:* ${ githubURL }` ),
	];
	return message;
};

export const getResultMessage = failureCount => {
	let buildInfo = `*BUILD #${ GITHUB_RUN_ID } FAILED:*

*Total failures:* ${ failureCount }
*E2E action run:* ${ runURL }
*Github branch:* ${ branchName }`;

	buildInfo += isPullRequest ? `\n*Github PR URL:* ` : '\n*Github branch URL:* ';
	buildInfo += githubURL;

	const message = [
		createSection( buildInfo ),
		createSection( `Build details are threaded :thread:` ),
	];

	if ( branchName === 'master' ) {
		message.push( createSection( ccBrbrr ) );
	}

	return message;
};

export const getSuccessMessage = () => {
	let buildInfo = `*BUILD #${ GITHUB_RUN_ID } PASSED:*

*E2E action run:* ${ runURL }
*Github branch:* ${ branchName }`;

	buildInfo += isPullRequest ? `\n*Github PR URL:* ` : '\n*Github branch URL:* ';
	buildInfo += githubURL;

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
