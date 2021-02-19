import { readFileSync, renameSync, existsSync } from 'fs';

import SlackReporter from '../reporters/slack';
import config from 'config';
import path from 'path';

/**
 * Goes through the messages in slack-specific log, and send these messages into slack
 */
async function processSlackLog() {
	const log = readFileSync(
		path.resolve( config.get( 'testOutputDir' ), 'logs/e2e-slack.log' )
	).toString();
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

	await slack.sendFileToSlack(
		path.resolve( config.get( 'testOutputDir' ), 'logs/e2e-simple.log' ),
		options
	);
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

/**
 * Goes through each line in the video_files file and attempts to rename the video files accordingly
 * The file is expected to contain lines of "current file name->new file name" pairs
 *
 * @return {Promise<void>}
 */
async function renameVideoFiles() {
	readFileSync( 'output/video_files', 'utf-8' )
		.split( /\r?\n/ )
		.forEach( function ( line ) {
			const names = line.split( '->' );
			if ( ! names[ 1 ] || ! existsSync( names[ 0 ] ) ) {
				return;
			}
			renameSync( names[ 0 ], names[ 1 ] );
		} );
}

module.exports = async function () {
	// Close tunnel
	await global.tunnelManager.close();

	await renameVideoFiles();
	if ( process.env.CI ) {
		await processSlackLog();
	}
};
