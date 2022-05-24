#!/usr/bin/env node

const { WebClient, ErrorCode, retryPolicies, LogLevel } = require( '@slack/web-api' );
const fs = require( 'fs' );
const config = require( 'config' );
const path = require( 'path' );
const yargs = require( 'yargs' );
const { getJetpackVersion } = require( '../helpers/utils-helper.cjs' );
const slackClient = new WebClient( config.get( 'slack.token' ), {
	retryConfig: retryPolicies.rapidRetryPolicy,
	logLevel: LogLevel.ERROR,
} );
const slackChannel = config.get( 'slack.channel' );
const rootPath = process.cwd();

// region yargs
// eslint-disable-next-line no-unused-expressions
yargs
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'suite [name]',
		'Sends a Slack notification with detailed test suite results',
		() => {
			yargs.positional( 'suite', {
				describe: 'Test suite name',
				type: 'string',
			} );
		},
		async argv => await reportTestRunResults( argv.name )
	)
	.command(
		'status [result]',
		'Sends a Slack notification containing only the run status',
		() => {
			yargs.positional( 'result', {
				describe: 'Test run results (e.g. "success")',
				type: 'string',
			} );
		},
		async argv => await reportJobRun( argv.result )
	)
	.option( 'report <name>', {
		type: 'string',
		description: 'Report name',
	} )
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
async function reportTestRunResults( suite = 'e2e' ) {
	let result;

	// If results summary file is not found send failure notification and exit
	try {
		result = JSON.parse(
			fs.readFileSync( path.join( rootPath, config.get( 'dirs.output' ), 'summary.json' ), 'utf8' )
		);
	} catch ( error ) {
		const errMsg = 'There was a problem parsing the test results file.';
		console.error( errMsg, error );
		await sendMessage( await buildDefaultMessage( false, errMsg ), {} );
		return;
	}

	const flatSuites = flattenSuites( result.suites );
	let specs = [];
	flatSuites.forEach( s => ( specs = specs.concat( s.specs ) ) );

	const detailLines = [];
	const failureDetails = [];
	let isSuccess = true;

	// Go through each spec, check tests and results and extract failure details
	// Expected structure spec: {tests: [{results: [{}]}]}
	specs.forEach( spec => {
		if ( ! spec.ok ) {
			isSuccess = false;
			detailLines.push( `- ${ spec.title }` );

			// Go through each test of the spec
			spec.tests.forEach( t => {
				t.results.forEach( r => {
					const content = `*${ spec.title }*\n\n\`\`\`${
						r.error ? r.error.message : 'unknown error'
					}\`\`\``;
					failureDetails.push( {
						type: 'stacktrace',
						content: content.substring( 0, 3000 ), //Slack max allowed
					} );

					r.attachments.forEach( attachment => {
						if ( attachment.contentType === 'image/png' ) {
							failureDetails.push( {
								type: 'file',
								content: attachment.path,
							} );
						}
					} );
				} );
			} );
		}
	} );

	// build the notification blocks
	const mainMsgBlocks = await buildDefaultMessage( isSuccess );

	// Add a header line
	let testListHeader = `*${ specs.length } ${ suite }* tests ran successfully`;
	if ( detailLines.length > 0 ) {
		testListHeader = `*${ detailLines.length }/${ specs.length } \`${ suite }\`* tests failed:`;
	}

	detailLines.splice( 0, 0, testListHeader );

	const testsListBlock = {
		type: 'context',
		elements: [
			{
				type: 'mrkdwn',
				text: detailLines.join( '\n' ),
			},
		],
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
		const logs = fs.readdirSync( path.join( rootPath, config.get( 'dirs.logs' ) ) );
		for ( const logFile of logs ) {
			if ( logFile.substring( logFile.lastIndexOf( '.' ) + 1 ) !== 'html' ) {
				await uploadFile( path.resolve( rootPath, config.get( 'dirs.logs' ), logFile ), {
					threadId,
				} );
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
	await sendMessage( await buildDefaultMessage( isSuccess ), {} );
}

//endregion

// region helper methods
/**
 * Pulls all Github information into a single object
 * Expecting an env variable named GITHUB_CONTEXT having the github context as value in json format
 *
 * @return {Object} object with all information
 */
function getGithubContext() {
	const { GITHUB_CONTEXT } = process.env;

	if ( ! GITHUB_CONTEXT ) {
		throw new Error(
			'Undefined GITHUB_CONTEXT. You should be running this in Github actions and github context should be dumped into GITHUB_CONTEXT env var.'
		);
	}

	const ctx = JSON.parse( GITHUB_CONTEXT );

	const gh = {
		run: {
			id: ctx.run_id,
			url: `${ ctx.server_url }/${ ctx.repository }/actions/runs/${ ctx.run_id }`,
		},
		branch: {},
	};

	if ( ctx.event_name === 'pull_request' ) {
		gh.pr = {};
		gh.pr.number = ctx.event.pull_request.number;
		gh.pr.url = ctx.event.pull_request.html_url;
		gh.pr.title = ctx.event.pull_request.title;

		gh.branch.name = ctx.head_ref;
	} else {
		gh.branch.name = ctx.ref.substring( 11 );
	}

	gh.branch.url = `${ ctx.server_url }/${ ctx.repository }/tree/${ gh.branch.name }`;

	return gh;
}

async function buildDefaultMessage( isSuccess, forceHeaderText = undefined ) {
	const gh = getGithubContext();

	const btnStyle = isSuccess ? 'primary' : 'danger';
	const dashboardUrl = 'https://automattic.github.io/jetpack-e2e-reports';
	let reportUrl;

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
				text: `${ gh.branch.name.substring( 0, 50 ) } branch`,
			},
			url: gh.branch.url,
			style: btnStyle,
		},
	];

	let reportNameString = '';
	if ( yargs.argv.report ) {
		reportNameString = `in \`${ yargs.argv.report }\` test run, `;
	}

	let headerText = forceHeaderText
		? forceHeaderText
		: `${
				isSuccess ? 'All tests passed' : 'There are test failures'
		  } ${ reportNameString }on branch \`<${ gh.branch.url }|${ gh.branch.name }>\``;

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
			: `${
					isSuccess ? 'All tests passed' : 'There are test failures'
			  } ${ reportNameString }for PR \`<${ gh.pr.url }|${ gh.pr.title }>\``;

		reportUrl = `${ dashboardUrl }/${ gh.pr.number }/report`;
	} else {
		reportUrl = `${ dashboardUrl }/${ gh.branch.name }/report`;
	}

	if ( yargs.argv.report ) {
		reportUrl = `${ dashboardUrl }/${ yargs.argv.report }/report`;
	}

	buttons.push( {
		type: 'button',
		text: {
			type: 'plain_text',
			text: `Report`,
		},
		url: reportUrl,
		style: btnStyle,
	} );

	const blocks = [
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

	// add Jetpack version
	const jetpackVersion = await getJetpackVersion();

	if ( jetpackVersion ) {
		blocks.splice( 1, 0, {
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: `Jetpack version: ${ jetpackVersion }`,
				},
			],
		} );
	}

	// mention interested parties
	try {
		let handles = [];

		for ( const branchEntry of config.get( 'slack.mentions.branches' ) ) {
			if ( gh.branch.name === branchEntry.name ) {
				handles = handles.concat( branchEntry.users );
			}
		}

		for ( const reportEntry of config.get( 'slack.mentions.reports' ) ) {
			if ( yargs.argv.report === reportEntry.name ) {
				handles = handles.concat( reportEntry.users );
			}
		}

		if ( handles.length > 0 && ! isSuccess ) {
			// Create a single string of unique Slack handles
			const mentions = [ ...new Set( handles ) ].join( ' ' );

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
	} catch ( error ) {
		console.log( `ERROR: ${ error }` );
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

function flattenSuites( suites ) {
	return suites.reduce( ( all, curr ) => {
		curr = Object.assign( {}, curr );
		all = all.concat( curr );
		if ( curr.suites ) {
			all = all.concat( flattenSuites( curr.suites ) );
			curr.suites = [];
		}
		return all;
	}, [] );
}

//endregion
