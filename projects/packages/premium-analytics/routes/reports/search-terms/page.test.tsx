/**
 * External dependencies
 */
import { ReportEmptyState, ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getSearchTermsFields, useSearchTermsReportRecords } from './config';
import SearchTermsReportPage from './page';
import type { SearchTermRow } from './config';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getSearchTermsFields: jest.fn( () => [] ),
	useSearchTermsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportCsvAction: () => null,
	ReportEmptyState: jest.fn( () => <div data-testid="report-empty-state" /> ),
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
const getSearchTermsFieldsMock = jest.mocked( getSearchTermsFields );
const reportEmptyStateMock = jest.mocked( ReportEmptyState );
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
		// `placeholderData` keeps rows mounted through a date/comparison refetch — clearing them
		// would drop the user's search, sort, and page position mid-refetch.
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

	it( 'replaces the records table with the empty state when the period has no terms', () => {
		mockRecords( { rows: [] } );

		render( <SearchTermsReportPage /> );

		expect( screen.getByTestId( 'report-empty-state' ) ).toBeInTheDocument();
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
	} );

	it( 'keeps the table and its search box when a search matches no terms', async () => {
		const { ReportRecordsTable: ActualReportRecordsTable } = jest.requireActual(
			'../../../packages/widgets-toolkit/src/components/report-page/report-records-table'
		);
		reportRecordsTableMock.mockImplementation( ActualReportRecordsTable );
		getSearchTermsFieldsMock.mockReturnValue( [
			{
				id: 'term',
				label: 'Search term',
				enableGlobalSearch: true,
				getValue: ( { item } ) => item.term,
			},
		] );
		mockRecords( {} );
		const user = userEvent.setup();

		render( <SearchTermsReportPage /> );
		await user.type( screen.getByRole( 'searchbox' ), 'no visitor searched this' );

		await expect( screen.findByText( 'No results' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'searchbox' ) ).toBeInTheDocument();
		expect( reportEmptyStateMock ).not.toHaveBeenCalled();
	} );
} );
