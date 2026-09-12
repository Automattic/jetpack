import { setInputData } from './test-utils.js';

describe( 'xUnit report content', () => {
	const rootPath = 'tests/resources/xunit';

	test( 'returns blocks for a failed test in a testsuite report', async () => {
		setInputData( { xunitReportPath: `${ rootPath }/single-report.xml` } );

		const { getXunitBlocks } = await import( '../src/xunit.js' );

		await expect( getXunitBlocks() ).resolves.toEqual( [
			{
				type: 'context',
				elements: [ { type: 'mrkdwn', text: '*1/3 tests failed*' } ],
			},
			{
				type: 'context',
				elements: [ { type: 'mrkdwn', text: '- Calculator: subtracts numbers' } ],
			},
			{
				type: 'divider',
			},
			{
				type: 'context',
				elements: [
					{ type: 'mrkdwn', text: '*Calculator: subtracts numbers*' },
					{
						type: 'mrkdwn',
						text: '```Expected 3 but received 4\nAssertionError: expected 4 to equal 3```',
					},
				],
			},
		] );
	} );

	test( 'combines failures and errors from multiple nested reports', async () => {
		setInputData( { xunitReportPath: `${ rootPath }/*-report.xml` } );

		const { getXunitBlocks } = await import( '../src/xunit.js' );
		const blocks = await getXunitBlocks();

		expect( blocks[ 0 ].elements[ 0 ].text ).toBe( '*2/5 tests failed*' );
		expect( blocks[ 1 ].elements[ 0 ].text ).toBe(
			'- API: returns a user\n- Calculator: subtracts numbers'
		);
		expect( blocks[ 3 ].elements[ 1 ].text ).toBe(
			'```TypeError\nCannot read properties of undefined```'
		);
		expect( blocks[ 5 ].elements[ 1 ].text ).toBe(
			'```Expected 3 but received 4\nAssertionError: expected 4 to equal 3```'
		);
	} );

	test.each`
		description               | xunitReportPath
		${ 'all tests passed' }   | ${ `${ rootPath }/all-passed.xml` }
		${ 'report not found' }   | ${ `${ rootPath }/missing.xml` }
		${ 'report not defined' } | ${ undefined }
	`( 'returns no blocks when $description', async ( { xunitReportPath } ) => {
		setInputData( { xunitReportPath } );

		const { getXunitBlocks } = await import( '../src/xunit.js' );

		await expect( getXunitBlocks() ).resolves.toEqual( [] );
	} );

	test( 'returns a parsing warning for malformed XML', async () => {
		setInputData( { xunitReportPath: `${ rootPath }/invalid.xml` } );

		const { getXunitBlocks } = await import( '../src/xunit.js' );

		await expect( getXunitBlocks() ).resolves.toEqual( [
			{
				type: 'context',
				elements: [ { type: 'mrkdwn', text: '*Unable to parse xUnit test results*' } ],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: 'There was a problem parsing one of the xUnit report files.',
					},
				],
			},
		] );
	} );
} );
