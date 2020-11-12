import { readFileSync } from 'fs';
import { teardown } from 'jest-environment-puppeteer';

import SlackReporter from './reporters/slack';

/**
 * Goes through the messages in slack-specific log, and send these messages into slack
 */
async function processSlackLog() {
	const log = readFileSync( './logs/e2e-slack.log' ).toString();
	const slack = new SlackReporter();
	const messages = getMessages( log );

	const failures = messages.filter( json => json.type === 'failure' );

	let response;
	if ( failures.length === 0 ) {
		response = await slack.sendSuccessMessage();
	} else {
		response = await slack.sendFailureMessage( failures );
	}

	const options = { thread_ts: response.ts };

	for ( const json of messages ) {
		switch ( json.type ) {
			case 'file':
				await slack.sendFileToSlack( json.message, options );
				break;

			case 'failure':
				await slack.sendMessageToSlack( slack.getFailedTestMessage( json ), options );
				break;

			case 'debuglog':
				await slack.sendSnippetToSlack( json.message, options );
				break;

			case 'message':
				await slack.sendMessageToSlack( json.message, options );
				break;
		}
	}

	await slack.sendFileToSlack( './logs/e2e-simple.log', options );
}

function getMessages( log ) {
	if ( log.length === 0 ) {
		return [];
	}
	const messages = log
		.trim()
		.split( '\n' )
		.map( string => JSON.parse( string ) );

	return messages;
}

module.exports = async function ( globalConfig ) {
	if ( process.env.CI ) {
		await processSlackLog();
	}
	await teardown( globalConfig );
};
