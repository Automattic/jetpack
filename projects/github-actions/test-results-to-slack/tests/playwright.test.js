const fs = require( 'fs' );
const { setInputData } = require( './test-utils' );

describe( 'Playwright report content', () => {
	const rootPath = 'tests/resources/playwright';

	test.each`
		description                                            | playwrightReportPath                  | expected
		${ 'one test failed in a single report' }              | ${ `${ rootPath }/1-37-failed.json` } | ${ `${ rootPath }/expected-blocks-01.json` }
		${ 'two tests failed in a two reports, with retries' } | ${ `${ rootPath }/*failed.json` }     | ${ `${ rootPath }/expected-blocks-02.json` }
		${ 'all tests passed' }                                | ${ `${ rootPath }/all-passed.json` }  | ${ [] }
		${ 'report not found' }                                | ${ `${ rootPath }/no-file.json` }     | ${ [] }
		${ 'report not defined' }                              | ${ undefined }                        | ${ [] }
	`( 'Playwright blocks: $description', async ( { playwrightReportPath, expected } ) => {
		setInputData( { playwrightReportPath } );

		if ( ! Array.isArray( expected ) ) {
			expected = JSON.parse( fs.readFileSync( expected, { encoding: 'utf8' } ) );
		}

		const { getPlaywrightBlocks } = require( '../src/playwright' );
		expect( getPlaywrightBlocks() ).toEqual( expected );
	} );

	test.each`
		description                    | outputPath                | attachmentPath                                             | expected
		${ 'one file found' }          | ${ '/path/to/artefacts' } | ${ '/path/to/artefacts/spec-1-retry-1/test-failed-1.png' } | ${ `${ rootPath }/suite-2/results/spec-1-retry-1/test-failed-1.png` }
		${ 'more files found' }        | ${ '/path/to/artefacts' } | ${ '/path/to/artefacts/spec-1/test-failed-1.png' }         | ${ `${ rootPath }/suite-1/results/spec-1/test-failed-1.png` }
		${ 'resolved path not found' } | ${ '/path/to/artefacts' } | ${ '/path/to/artefacts/spec-X/test-failed-1.png' }         | ${ '/path/to/artefacts/spec-X/test-failed-1.png' }
	`(
		'Convert attachments paths: $description',
		async ( { outputPath, attachmentPath, expected } ) => {
			const playwrightOutputDir = `${ rootPath }/**/results`;
			setInputData( { playwrightOutputDir } );

			const { getAttachmentPath } = require( '../src/playwright' );
			expect( getAttachmentPath( outputPath, attachmentPath ) ).toEqual( expected );
		}
	);
} );
