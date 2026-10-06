/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import * as buildCsvModule from '../../../helpers/build-csv';
import { ReportCsvAction } from '../../report-page/report-csv-action';
import { RowsCsvDownloadButton } from '../rows-csv-download-button';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const mockGetScriptData = jest.mocked( getScriptData );

describe( 'RowsCsvDownloadButton', () => {
	let mockBuildCsv: jest.SpiedFunction< typeof buildCsvModule.buildCsv >;
	let mockSaveCsv: jest.SpiedFunction< typeof buildCsvModule.saveCsv >;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( undefined );
		mockBuildCsv = jest.spyOn( buildCsvModule, 'buildCsv' );
		mockSaveCsv = jest.spyOn( buildCsvModule, 'saveCsv' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.useRealTimers();
		mockBuildCsv.mockRestore();
		mockSaveCsv.mockRestore();
	} );

	it( 'builds and saves rows after committing the loading state', async () => {
		const rows = [ { title: 'Hello' } ];
		const columns = [ { label: 'Title', getValue: ( row: { title: string } ) => row.title } ];

		render( <RowsCsvDownloadButton columns={ columns } rows={ rows } filename="top-posts" /> );

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( mockSaveCsv ).not.toHaveBeenCalled();
		await waitFor( () => expect( mockBuildCsv ).toHaveBeenCalledWith( columns, rows ) );
		expect( mockSaveCsv ).toHaveBeenCalledWith( 'top-posts', '"Title"\n"Hello"' );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'stays hidden when there are no rows', () => {
		render(
			<RowsCsvDownloadButton
				columns={ [ { label: 'Title', getValue: row => row.title } ] }
				rows={ [] }
				filename="top-posts"
			/>
		);

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'stays hidden when the server disables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: {
				initial_full_sync_finished: 1,
				csv_exports_enabled: false,
			},
		} as ReturnType< typeof getScriptData > );

		render(
			<RowsCsvDownloadButton
				columns={ [ { label: 'Title', getValue: row => row.title } ] }
				rows={ [ { title: 'Hello' } ] }
				filename="top-posts"
			/>
		);

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ReportCsvAction', () => {
	beforeEach( () => {
		mockGetScriptData.mockReturnValue( undefined );
	} );

	it( 'renders a labelled button without an icon', () => {
		render(
			<ReportCsvAction
				columns={ [ { label: 'Title', getValue: ( row: { title: string } ) => row.title } ] }
				rows={ [ { title: 'Hello' } ] }
				filename="top-posts"
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Download CSV' } );
		expect( button ).toHaveTextContent( 'Download CSV' );
		// eslint-disable-next-line testing-library/no-node-access -- the icon is hidden from the accessibility tree.
		expect( button.querySelector( 'svg' ) ).toBeNull();
	} );
} );
