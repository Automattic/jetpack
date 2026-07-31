/**
 * External dependencies
 */
import { ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useSearchTermsReportRecords } from './config';
import SearchTermsReportPage from './page';
import type { SearchTermRow } from './config';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getSearchTermsFields: () => [],
	useSearchTermsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportCsvAction: () => null,
	ReportErrorState: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportRecordsTable: jest.fn( () => null ),
	useReportCsvExport: () => ( { canExport: false, rows: [], filename: 'search-terms' } ),
	useReportRetry: ( refetch: () => unknown ) => refetch,
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {
		from: '2026-06-01',
		to: '2026-06-07',
		interval: 'day',
	} ),
} ) );

const useRecordsMock = jest.mocked( useSearchTermsReportRecords );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

const row: SearchTermRow = {
	id: 'jetpack search',
	term: 'jetpack search',
	views: 42,
};

/**
 * Stub the records hook with one populated row, settled by default.
 *
 * @param table - Table request-state fields to override for the case under test.
 */
function mockRecords( table: Record< string, unknown > ) {
	useRecordsMock.mockReturnValue( {
		isError: false,
		refetch: jest.fn(),
		table: {
			rows: [ row ],
			hasComparison: true,
			isLoading: false,
			isFetching: false,
			...table,
		},
	} as unknown as ReturnType< typeof useSearchTermsReportRecords > );
}

describe( 'SearchTermsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'reports the loading state on first load, when there is nothing to show yet', () => {
		mockRecords( { rows: [], hasComparison: false, isLoading: true, isFetching: true } );

		render( <SearchTermsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [], isLoading: true } )
		);
	} );

	it( 'keeps the rows on screen while a background refetch is in flight', () => {
		// The queries carry `placeholderData`, so a refetch triggered by a date or
		// comparison change still has the previous rows. Handing the table an empty
		// set would drop the user's search, sorting, and page position mid-refetch,
		// so the rows stay mounted and only the loading state reflects the refetch.
		mockRecords( { isFetching: true } );

		render( <SearchTermsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [ row ], isLoading: true } )
		);
	} );

	it( 'shows current rows once the requests are settled', () => {
		mockRecords( {} );

		render( <SearchTermsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [ row ], isLoading: false } )
		);
	} );
} );
