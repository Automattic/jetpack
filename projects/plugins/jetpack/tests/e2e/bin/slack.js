#!/usr/bin/env node

const { WebClient, ErrorCode, retryPolicies, LogLevel } = require( '@slack/web-api' );
const fs = require( 'fs' );
const config = require( 'config' );
const path = require( 'path' );
const yargs = require( 'yargs' );
const { fileNameFormatter } = require( '../lib/utils-helper' );
const slackClient = new WebClient( config.get( 'slack.token' ), {
	retryConfig: retryPolicies.rapidRetryPolicy,
	logLevel: LogLevel.ERROR,
} );
const slackChannel = config.get( 'slack.channel' );

// region yargs
// eslint-disable-next-line no-unused-expressions
yargs
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'run [suite]',
		'Sends a Slack notification with test run results.',
		() => {
			yargs.positional( 'suite', {
				describe: 'Test suite name',
				type: 'string',
			} );
		},
		async argv => await reportTestRunResults( argv.suite )
	)
	.command(
		'job <status>',
		'Sends a Slack notification with CI job status which can include more test runs.',
		() => {
			yargs.positional( 'status', {
				describe: 'Job status',
				type: 'string',
			} );
		},
		async argv => await reportJobRun( argv.status )
	)
	.help( 'h' )
	.alias( 'h', 'help' ).argv;

//endregion

// region main methods
/**
 * Sends a Slack notification with test run results.
 * Content is built from test output (reports, logs, screenshots, etc.) and Github env variables.
 *
 * @param {string} suite test suite name
 * @return {Promise<void>}
 */
async function reportTestRunResults( suite = 'Jetpack e2e tests' ) {
	let result;

	// If results summary file is not found send failure notification and exit
	try {
		result = JSON.parse( fs.readFileSync( 'output/summary.json', 'utf8' ) );
	} catch ( error ) {
		const errMsg = 'There was a problem parsing the test results file.';
		console.error( errMsg );
		await sendMessage( buildDefaultMessage( false, errMsg ), {} );
		return;
	}

	const detailLines = [];
	const failureDetails = [];
	const screenshots = fs.readdirSync( config.get( 'dirs.screenshots' ) );
	const matchedScreenshots = [];

	// Go through all test results and extract failure details
	for ( const tr of result.testResults ) {
		for ( const ar of tr.assertionResults ) {
			if ( ar.status !== 'passed' ) {
				detailLines.push( `- ${ ar.fullName }` );
				for ( const failureMessage of ar.failureMessages ) {
					failureDetails.push( {
						type: 'stacktrace',
						content: `*${ ar.fullName }*\n\n\`\`\`${ failureMessage }\`\`\``,
					} );
				}

				// try to find a screenshot for this failed test
				const expectedScreenshotName = fileNameFormatter( ar.title, false );

				for ( const screenshot of screenshots ) {
					if ( screenshot.indexOf( expectedScreenshotName ) > -1 ) {
						failureDetails.push( {
							type: 'file',
							content: path.resolve( config.get( 'dirs.screenshots' ), screenshot ),
						} );
						matchedScreenshots.push( screenshot );
					}
				}
			}
		}
	}

	// Add any remaining screenshots (not matching any test name)
	const remainingScreenshots = screenshots.filter( s => matchedScreenshots.indexOf( s ) === -1 );
	for ( const screenshot of remainingScreenshots ) {
		failureDetails.push( {
			type: 'file',
			content: path.resolve( config.get( 'dirs.screenshots' ), screenshot ),
		} );
	}

	// build the notification blocks
	const mainMsgBlocks = buildDefaultMessage( result.success );

	// Add a header line
	let testListHeader = `*${ result.numTotalTests } ${ suite }* tests ran successfully`;
	if ( detailLines.length > 0 ) {
		testListHeader = `*${ detailLines.length }/${ result.numTotalTests } \`${ suite }\`* tests failed:`;
		detailLines.push( '\nmore details in :thread:' );
	}

	detailLines.splice( 0, 0, testListHeader );

	const testsListBlock = {
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: detailLines.join( '\n' ),
		},
	};

	mainMsgBlocks.splice( 1, 0, testsListBlock );

	// Send the main message
	const response = await sendMessage( mainMsgBlocks, {} );
	const threadId = response.ts;

	// Send failure details in thread
	for ( const entry of failureDetails ) {
		switch ( entry.type ) {
			case 'stacktrace':
				const threadBlocks = [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: entry.content,
						},
					},
				];
				await sendMessage( threadBlocks, { threadId } );
				break;
			case 'file':
				await uploadFile( entry.content, { threadId } );
				break;
		}
	}

	// Upload log files
	if ( failureDetails.length > 0 ) {
		const logs = fs.readdirSync( config.get( 'dirs.logs' ) );
		for ( const logFile of logs ) {
			if ( logFile.substring( logFile.lastIndexOf( '.' ) + 1 ) !== 'html' ) {
				await uploadFile( path.resolve( config.get( 'dirs.logs' ), logFile ), { threadId } );
			}
		}
	}
}

/**
 * Sends a Slack notification with the result of a Github action job.
 * The job can include multiple test runs and we only want to report success or failure, without details.
 * This is useful as a heartbeat notification, if sent on success only, to know tests are still running and everything works fine
 *
 * @param {string} status job status. used to determine if job was successful or not
 * @return {Promise<void>}
 */
async function reportJobRun( status ) {
	const isSuccess = status === 'success';
	await sendMessage( buildDefaultMessage( isSuccess ), {} );
}

//endregion

// region helper methods
/**
 * Pulls all Github information into a single object
 *
 * @return {Object} object with all information
 */
function getGithubInfo() {
	const { GITHUB_EVENT_PATH, GITHUB_RUN_ID } = process.env;

	if ( ! GITHUB_EVENT_PATH || ! GITHUB_RUN_ID ) {
		throw new Error(
			'Undefined GITHUB_EVENT_PATH and/or GITHUB_RUN_ID. Are you running this in Github actions?'
		);
	}

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

function buildDefaultMessage( isSuccess, forceHeaderText = undefined ) {
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

	let headerText = forceHeaderText
		? forceHeaderText
		: `${ isSuccess ? 'All tests passed' : 'There are test failures' } against \`<${
				gh.branch.url
		  }|${ gh.branch.name }>\` branch`;

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

		headerText = forceHeaderText
			? forceHeaderText
			: `${ isSuccess ? 'All tests passed' : 'There are test failures' } for PR \`<${ gh.pr.url }|${
					gh.pr.title
			  }>\``;
	}

	const blocks = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: headerText,
			},
		},
		{
			type: 'divider',
		},
		{
			type: 'actions',
			elements: buttons,
		},
		{
			type: 'divider',
		},
	];

	if ( ! gh.pr && ! isSuccess && gh.branch.name === config.get( 'repository.mainBranch' ) ) {
		const mentions = config
			.get( 'slack.mentions' )
			.map( function ( userId ) {
				return ` <@${ userId }>`;
			} )
			.join( ' ' );

		blocks.push(
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `cc ${ mentions }`,
				},
			},
			{
				type: 'divider',
			}
		);
	}

	return blocks;
}

async function sendMessage( blocks, { channel = slackChannel, icon = ':jetpack:', threadId } ) {
	return await sendRequestToSlack(
		async () =>
			await slackClient.chat.postMessage( {
				blocks,
				channel,
				username: 'E2E tests reporter',
				icon_emoji: icon,
				thread_ts: threadId,
			} )
	);
}

async function uploadFile( filePath, { channel = slackChannel, threadId } ) {
	return await sendRequestToSlack(
		async () =>
			await slackClient.files.upload( {
				fileName: filePath,
				file: fs.createReadStream( filePath ),
				channels: channel,
				thread_ts: threadId,
			} )
	);
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

//endregion
