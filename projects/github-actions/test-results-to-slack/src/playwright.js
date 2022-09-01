const fs = require( 'fs' );
const { getInput } = require( '@actions/core' );
const glob = require( 'glob' );
const { debug, error } = require( './debug' );

/**
 * Parses multiple Playwright JSON reports and returns details about the failed tests.
 *
 * @returns {object} an array of Slack blocks with test failure details.
 */
function getPlaywrightBlocks() {
	const blocks = [];
	const { reports, parseError } = getPlaywrightReports();
	const failedTests = [];
	const failureDetailsBlocks = [];
	let specsCount = 0;

	for ( const report of reports ) {
		const suites = flattenSuites( report.suites );

		let specs = [];
		suites.forEach( s => ( specs = specs.concat( s.specs ) ) );

		// Go through each spec, check tests and results and extract failure details
		// Expected structure spec: {tests: [{results: [{}]}]}
		specsCount += specs.length;
		specs.forEach( spec => {
			debug( `Spec: ${ spec.title }` );
			if ( ! spec.ok ) {
				failedTests.push( `- ${ spec.title }` );

				// Go through each test of the spec
				spec.tests.forEach( t => {
					t.results.forEach( r => {
						const content = `\`\`\`${ r.error ? r.error.message : 'unknown error' }\`\`\``;
						failureDetailsBlocks.push(
							{
								type: 'divider',
							},
							{
								type: 'context',
								elements: [
									{
										type: 'mrkdwn',
										text: `*${ spec.title } ${ r.retry > 0 ? 'retry #' + r.retry : '' }*`,
									},
									{
										type: 'mrkdwn',
										text: content.substring( 0, 3000 ),
									},
								],
							}
						);
					} );
				} );
			}
		} );
	}

	if ( parseError ) {
		failedTests.push( 'There was a problem parsing one of the test results file.' );
	}

	if ( failedTests.length > 0 ) {
		blocks.push(
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `*${ failedTests.length }/${ specsCount } tests failed*`,
					},
					{
						type: 'mrkdwn',
						text: failedTests.join( '\n' ),
					},
				],
			},
			...failureDetailsBlocks
		);
	}

	return blocks;
}

/**
 * Parses multiple Playwright JSON reports and returns their content as an array of objects.
 *
 * @returns {object} an array of Playwright reports.
 */
function getPlaywrightReports() {
	let parseError = false;
	const reports = [];

	for ( const path of getPlaywrightReportsPaths() ) {
		try {
			debug( `Reading Playwright report from ${ path }.` );
			const report = JSON.parse( fs.readFileSync( path, { encoding: 'utf8' } ) );
			reports.push( report );
		} catch ( err ) {
			debug( `There was a problem parsing the test reports. ${ err }.` );
			parseError = true;
		}
	}

	return { reports, parseError };
}

/**
 * Parses the 'playwright_report_path' input and finds matching files.
 *
 * @returns {Array} an array of matching paths.
 */
function getPlaywrightReportsPaths() {
	const playwrightReportPath = getInput( 'playwright_report_path' );
	const paths = [];

	if ( playwrightReportPath ) {
		paths.push( ...glob.sync( playwrightReportPath ) );
	} else {
		debug( 'No Playwright report path defined.' );
	}

	if ( paths.length === 0 ) {
		error( 'No Playwright report found.' );
	}

	return paths;
}

/**
 * Flattens the suites in a Playwright report.
 *
 * @param {[object]} suites - an array of nested suites from a Playwright test report
 * @returns {[object]} an array of flattened suites
 */
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

module.exports = { getPlaywrightBlocks };
