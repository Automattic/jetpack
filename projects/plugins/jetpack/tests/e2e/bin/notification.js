#!/usr/bin/env node

const { WebClient, ErrorCode, retryPolicies } = require( '@slack/web-api' );
const fs = require( 'fs' );
const config = require( 'config' );
const yargs = require( 'yargs' );
const slackClient = new WebClient( config.get( 'slack.token' ), {
	retryConfig: retryPolicies.rapidRetryPolicy,
} );
const slackChannel = config.get( 'slack.channel' );

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
 *
 * @return {Promise<void>}
 */
async function reportTestRunResults() {
	const isSuccess = false; //todo replace me with script arg
	const mainMsgBlocks = buildDefaultMessage( isSuccess );

	const result = JSON.parse( fs.readFileSync( 'output/summary.json', 'utf8' ) );

	const results = [];
	const stackTraces = [];

	for ( const tr of result.testResults ) {
		for ( const ar of tr.assertionResults ) {
			if ( ar.status !== 'passed' ) {
				results.push( `- ${ ar.fullName }` );
				stackTraces.push( `*${ ar.fullName }*\n\n\`\`\`${ ar.failureMessages }\`\`\`` );
			}
		}
	}

	if ( results.length > 0 ) {
		results.splice(
			0,
			0,
			`*${ results.length }* failed tests (out of *${ result.numTotalTests }*):`
		);
	}

	const testsListBlock = {
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: results.join( '\n' ),
		},
	};

	mainMsgBlocks.splice( 1, 0, testsListBlock );

	const response = await sendMessage( mainMsgBlocks, {} );
	const threadId = response.ts;
	console.log( threadId );

	for ( const stacktrace of stackTraces ) {
		const threadBlocks = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: stacktrace,
				},
			},
		];

		await sendMessage( threadBlocks, { threadId } );
	}
}

/**
 * Sends a Slack notification with the result of a Github action job.
 * The job can include multiple test runs and we only want to report success or failure, without details.
 * This is useful as a heartbeat notification, if sent on success only, to know tests are still running and everything works fine
 *
 * @return {Promise<void>}
 */
async function reportJobRun() {
	// eslint-disable-next-line no-unused-vars
	const isSuccess = true; //todo replace me with script arg
	await sendMessage( buildDefaultMessage( true ), {} );
}

/**
 * Pulls all Github information into a single object
 *
 * @return {Object} object with all information
 */
function getGithubInfo() {
	const { GITHUB_EVENT_PATH, GITHUB_RUN_ID } = process.env;
	const event = JSON.parse( fs.readFileSync( GITHUB_EVENT_PATH, 'utf8' ) );

	const gh = {
		run: {
			id: GITHUB_RUN_ID,
			url: `${ event.repository.html_url }/actions/runs/${ GITHUB_RUN_ID }`,
		},
		branch: {},
	};

	if ( event.pull_request ) {
		gh.pr = {};
		gh.pr.number = event.pull_request.number;
		gh.pr.url = event.pull_request.html_url;
		gh.pr.title = event.pull_request.title;

		gh.branch.name = event.pull_request.head.ref;
	} else {
		gh.branch.name = event.ref.substr( 11 );
	}

	gh.branch.url = `${ event.repository.html_url }/tree/${ gh.branch.name }`;

	return gh;
}

function buildDefaultMessage( isSuccess ) {
	const gh = getGithubInfo();

	const btnStyle = isSuccess ? 'primary' : 'danger';

	const buttons = [
		{
			type: 'button',
			text: {
				type: 'plain_text',
				text: `Run #${ gh.run.id }`,
			},
			url: gh.run.url,
			style: btnStyle,
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				text: `${ gh.branch.name } branch`,
			},
			url: gh.branch.url,
			style: btnStyle,
		},
	];

	let headerText = `${ isSuccess ? 'All tests passed' : 'There are test failures' } against <${
		gh.branch.url
	}|${ gh.branch.name }> branch`;

	if ( gh.pr ) {
		buttons.push( {
			type: 'button',
			text: {
				type: 'plain_text',
				text: `PR #${ gh.pr.number }`,
			},
			url: gh.pr.url,
			style: btnStyle,
		} );

		headerText = `${ isSuccess ? 'All tests passed' : 'There are test failures' } for PR <${
			gh.pr.url
		}|${ gh.pr.title }>`;
	}

	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: headerText,
			},
		},
		{
			type: 'actions',
			elements: buttons,
		},
	];
}

async function sendMessage( blocks, { channel = slackChannel, icon = ':jetpack:', threadId } ) {
	//thread_ts: response.ts
	const payload = Object.assign( {
		blocks,
		channel,
		username: 'E2E tests reporter',
		icon_emoji: icon,
		thread_ts: threadId,
	} );

	return await sendRequestToSlack( async () => await slackClient.chat.postMessage( payload ) );
}

async function sendRequestToSlack( fn ) {
	try {
		return await fn();
	} catch ( error ) {
		if (
			error.code === ErrorCode.PlatformError ||
			error.code === ErrorCode.RequestError ||
			error.code === ErrorCode.RateLimitedError ||
			error.code === ErrorCode.HTTPError
		) {
			console.log( error.data );
		} else {
			console.log( `ERROR: ${ error }` );
		}
	}
}
