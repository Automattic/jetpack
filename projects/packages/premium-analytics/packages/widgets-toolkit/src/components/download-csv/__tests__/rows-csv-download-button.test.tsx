/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { buildCsv, saveCsv } from '../../../helpers/build-csv';
import { RowsCsvDownloadButton } from '../rows-csv-download-button';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '../../../helpers/build-csv', () => ( {
	buildCsv: jest.fn( () => '"Title"\n"Hello"' ),
	saveCsv: jest.fn(),
} ) );

const mockBuildCsv = jest.mocked( buildCsv );
const mockSaveCsv = jest.mocked( saveCsv );
const mockGetScriptData = jest.mocked( getScriptData );

describe( 'RowsCsvDownloadButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( undefined );
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
				has_store_data: false,
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
