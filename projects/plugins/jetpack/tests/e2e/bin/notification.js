#!/usr/bin/env node

const { SlackReporter } = require( '../lib/reporters/slack' );
const fs = require( 'fs' );
const config = require( 'config' );
const yargs = require( 'yargs' );
const path = require( 'path' );

// eslint-disable-next-line no-unused-expressions
yargs
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'run',
		'Sends a Slack notification with test run results.',
		() => {},
		async () => await reportTestRunResults()
	)
	.command(
		'job',
		'Sends a Slack notification with CI job status which can include more test runs.',
		() => {},
		async () => await reportJobRun()
	)
	.help( 'h' )
	.alias( 'h', 'help' ).argv;

/**
 * Sends a Slack notification with test run results.
 * Content is built from test output (reports, logs, screenshots, etc.) and Github env variables.
 * Ideally should only run when failures are detected.
 *
 * @return {Promise<void>}
 */
async function reportTestRunResults() {
	const log = fs
		.readFileSync( path.resolve( config.get( 'dirs.logs' ), 'e2e-slack.log' ) )
		.toString();
	const slack = new SlackReporter();

	let messages = [];
	if ( log.length > 0 ) {
		messages = log
			.trim()
			.split( '\n' )
			.map( string => JSON.parse( string ) );
	}

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
		path.resolve( config.get( 'dirs.logs' ), 'e2e-simple.log' ),
		options
	);
}

/**
 * Sends a Slack notification with the result of a Github action job.
 * The job can include multiple test runs and we only want to report success or failure, without details.
 * This is useful as a heartbeat notification => send on success only, to know tests are still running and everything works fine
 *
 * @return {Promise<void>}
 */
async function reportJobRun() {
	console.log( 'report job run' );
}
