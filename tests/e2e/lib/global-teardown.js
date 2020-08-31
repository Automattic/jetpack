import { readFileSync } from 'fs';
import { teardown } from 'jest-environment-puppeteer';

import {
	sendSnippetToSlack,
	sendMessageToSlack,
	sendFileToSlack,
	getFailedTestMessage,
	getResultMessage,
	getSuccessMessage,
} from './reporters/slack';
module.exports = async function ( globalConfig ) {
	if ( process.env.CI ) {
		await processSlackLog();
	}
	await teardown( globalConfig );
};

/**
 * Goes through the messages in slack-specific log, and send these messages into slack
 */
async function processSlackLog() {
	const log = readFileSync( './logs/e2e-slack.log' ).toString();

	if ( log.length === 0 ) {
		return await sendMessageToSlack( getSuccessMessage() );
	}

	const messages = log
		.trim()
		.split( '\n' )
		.map( string => JSON.parse( string ) );

	const failures = messages.filter( json => json.type === 'failure' );

	const response = await sendMessageToSlack( getResultMessage( failures.length ) );
	const options = { thread_ts: response.ts };

	for ( const json of messages ) {
		switch ( json.type ) {
			case 'file':
				await sendFileToSlack( json.message, options );
				break;

			case 'failure':
				await sendMessageToSlack( getFailedTestMessage( json ), options );
				break;

			case 'debuglog':
				await sendSnippetToSlack( json.message, options );
				break;
		}
	}

	await sendFileToSlack( './logs/e2e-simple.log', options );
}
