const fs = require( 'fs' );
const { getInput } = require( '@actions/core' );
const { debug } = require( './debug' );

/**
 * Parses multiple Playwright JSON reports and returns details about the failed tests.
 *
 * @returns {object} an array of Slack blocks with test failure details.
 */
function getPlaywrightBlocks() {
	const blocks = [];
	const { reports, parseError } = getPlaywrightReports();

	for ( const report of reports ) {
		const suites = flattenSuites( report.suites );

		fs.writeFileSync( './tests/ignore/_suites.json', JSON.stringify( suites, null, 2 ) );

		let specs = [];
		suites.forEach( s => ( specs = specs.concat( s.specs ) ) );

		const summaryLines = [];
		const failureDetailsBlocks = [];

		// Go through each spec, check tests and results and extract failure details
		// Expected structure spec: {tests: [{results: [{}]}]}
		specs.forEach( spec => {
			if ( ! spec.ok ) {
				summaryLines.push( `- ${ spec.title }` );

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

						// r.attachments.forEach( attachment => {
						// 	if ( attachment.contentType === 'image/png' ) {
						// 		failureDetailsBlocks.push( {
						// 			type: 'image',
						// 			image_url: attachment.path,
						// 			alt_text: attachment.name,
						// 		} );
						// 	}
						// } );
					} );
				} );
			}
		} );

		if ( parseError ) {
			summaryLines.push( 'There was a problem parsing one of the test results file.' );
		}

		blocks.push(
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: summaryLines.join( '\n' ),
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
			debug( `Reading Playwright report from ${ path }` );
			const report = JSON.parse( fs.readFileSync( path, { encoding: 'utf8' } ) );
			reports.push( report );
		} catch ( err ) {
			debug( `There was a problem parsing the test reports. ${ err }` );
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
		// todo parse path string and find all matching reports
		paths.push( playwrightReportPath );
	} else {
		debug( 'No Playwright report path defined.' );
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
