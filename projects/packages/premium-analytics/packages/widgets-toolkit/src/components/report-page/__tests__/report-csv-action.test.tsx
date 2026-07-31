/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { RowsCsvDownloadButton } from '../../download-csv/rows-csv-download-button';
import { ReportCsvAction } from '../report-csv-action';

jest.mock( '../../download-csv/rows-csv-download-button', () => ( {
	RowsCsvDownloadButton: jest.fn( () => null ),
} ) );

const rowsCsvDownloadButtonMock = jest.mocked( RowsCsvDownloadButton );

describe( 'ReportCsvAction', () => {
	it( 'applies the standard report action presentation', () => {
		const props = {
			columns: [ { label: 'Title', getValue: ( row: { title: string } ) => row.title } ],
			rows: [ { title: 'Hello' } ],
			filename: 'top-posts',
		};

		render( <ReportCsvAction { ...props } /> );

		expect( rowsCsvDownloadButtonMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				...props,
				label: 'Download',
				variant: 'solid',
				showIcon: false,
			} )
		);
	} );
} );
