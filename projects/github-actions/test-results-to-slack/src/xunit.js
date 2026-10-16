import fs from 'fs';
import { getInput } from '@actions/core';
import { glob } from 'glob';
import { parseStringPromise } from 'xml2js';
import { debug } from './debug.js';

/**
 * Parses xUnit XML reports and returns details about the failed tests.
 *
 * @return {Promise<Array>} an array of Slack blocks with test failure details.
 */
export async function getXunitBlocks() {
	const blocks = [];
	const { reports, parseError } = await getXunitReports();
	const failedTests = [];
	const failureDetailsBlocks = [];
	let testsCount = 0;

	for ( const report of reports ) {
		const testCases = getTestCases( report );
		testsCount += testCases.length;

		for ( const testCase of testCases ) {
			const issues = [ ...toArray( testCase.failure ), ...toArray( testCase.error ) ];

			if ( issues.length === 0 ) {
				continue;
			}

			const title = getTestCaseTitle( testCase );
			const details =
				issues.map( getIssueText ).filter( Boolean ).join( '\n\n' ) || 'unknown error';
			const content = `\`\`\`${ details }\`\`\``;

			failedTests.push( `- ${ title }` );
			failureDetailsBlocks.push(
				{
					type: 'divider',
				},
				{
					type: 'context',
					elements: [
						{
							type: 'mrkdwn',
							text: `*${ title }*`,
						},
						{
							type: 'mrkdwn',
							text: content.substring( 0, 3000 ),
						},
					],
				}
			);
		}
	}

	const summaryItems = [ ...failedTests ];
	if ( parseError ) {
		summaryItems.push( 'There was a problem parsing one of the xUnit report files.' );
	}

	if ( summaryItems.length > 0 ) {
		const summary =
			failedTests.length > 0
				? `*${ failedTests.length }/${ testsCount } tests failed*`
				: '*Unable to parse xUnit test results*';

		blocks.push(
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: summary,
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: summaryItems.join( '\n' ),
					},
				],
			},
			...failureDetailsBlocks
		);
	}

	return blocks;
}

/**
 * Parses matching xUnit XML report files.
 *
 * @return {Promise<object>} parsed reports and whether a report failed to parse.
 */
async function getXunitReports() {
	let parseError = false;
	const reports = [];

	for ( const path of getXunitReportPaths() ) {
		try {
			debug( `Reading xUnit report from ${ path }.` );
			const report = await parseStringPromise( fs.readFileSync( path, { encoding: 'utf8' } ) );
			reports.push( report );
		} catch ( err ) {
			debug( `There was a problem parsing the xUnit reports. ${ err }.` );
			parseError = true;
		}
	}

	return { reports, parseError };
}

/**
 * Finds files matching the configured xUnit report path.
 *
 * @return {Array} matching report paths.
 */
function getXunitReportPaths() {
	const xunitReportPath = getInput( 'xunit_report_path' );
	const paths = [];

	if ( xunitReportPath ) {
		paths.push( ...glob.sync( xunitReportPath ).sort() );
	} else {
		debug( 'No xUnit report path defined.' );
	}

	if ( paths.length === 0 ) {
		debug( 'No xUnit report found.' );
	}

	return paths;
}

/**
 * Finds test cases in either testsuite or testsuites xUnit structures.
 *
 * @param {object|Array} node - a parsed xUnit node.
 * @return {Array} test case nodes.
 */
function getTestCases( node ) {
	if ( Array.isArray( node ) ) {
		return node.flatMap( getTestCases );
	}

	if ( ! node || typeof node !== 'object' ) {
		return [];
	}

	return [
		...toArray( node.testcase ),
		...toArray( node.testsuite ).flatMap( getTestCases ),
		...toArray( node.testsuites ).flatMap( getTestCases ),
	];
}

/**
 * Returns a useful name for a test case.
 *
 * @param {object} testCase - a parsed xUnit test case.
 * @return {string} test case title.
 */
function getTestCaseTitle( testCase ) {
	const name = testCase.$?.name?.trim();
	const className = testCase.$?.classname?.trim();

	if ( name && className ) {
		return `${ className }: ${ name }`;
	}

	return name || className || 'Unknown test';
}

/**
 * Returns the readable message and body of an xUnit failure or error node.
 *
 * @param {object|string} issue - a parsed xUnit failure or error.
 * @return {string} readable failure details.
 */
function getIssueText( issue ) {
	if ( typeof issue === 'string' ) {
		return issue.trim();
	}

	if ( ! issue || typeof issue !== 'object' ) {
		return '';
	}

	const message = issue.$?.message?.trim() || issue.$?.type?.trim();
	const body = typeof issue._ === 'string' ? issue._.trim() : '';

	return [ message, body ]
		.filter( ( value, index, values ) => value && values.indexOf( value ) === index )
		.join( '\n' );
}

/**
 * Normalizes optional singleton or array values into an array.
 *
 * @param {*} value - the value to normalize.
 * @return {Array} normalized values.
 */
function toArray( value ) {
	if ( value === undefined || value === null ) {
		return [];
	}

	return Array.isArray( value ) ? value : [ value ];
}
