const fs = require( 'fs' );
const { setInputData } = require( './test-utils' );

describe( 'Playwright report content', () => {
	afterEach( () => {
		delete process.env.INPUT_PLAYWRIGHT_REPORT_PATH;
	} );

	const rootPath = 'tests/resources/playwright';
	test.each`
		description                                            | playwrightReportPath                  | expected
		${ 'One test failed in a single report' }              | ${ `${ rootPath }/1-37-failed.json` } | ${ `${ rootPath }/expected-blocks-01.json` }
		${ 'Two tests failed in a two reports, with retries' } | ${ `${ rootPath }/*failed.json` }     | ${ `${ rootPath }/expected-blocks-02.json` }
		${ 'All tests passed' }                                | ${ `${ rootPath }/all-passed.json` }  | ${ [] }
		${ 'Report not found' }                                | ${ `${ rootPath }/no-file.json` }     | ${ [] }
		${ 'Report not defined' }                              | ${ undefined }                        | ${ [] }
	`( '$description', async ( { playwrightReportPath, expected } ) => {
		setInputData( { playwrightReportPath } );

		if ( ! Array.isArray( expected ) ) {
			expected = JSON.parse( fs.readFileSync( expected, { encoding: 'utf8' } ) );
		}

		const { getPlaywrightBlocks } = require( '../src/playwright' );
		expect( getPlaywrightBlocks() ).toEqual( expected );
	} );
} );
