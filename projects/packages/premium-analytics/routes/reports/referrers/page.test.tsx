/**
 * External dependencies
 */
import { ReportDrilldownTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReferrersReportRecords } from './config';
import ReferrersReportPage from './page';
import type { ReferrerRecord } from './config';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getReferrerFields: () => [],
	useReferrersReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportCsvAction: () => null,
	ReportDrilldownTable: jest.fn( () => null ),
	ReportEmptyState: () => <div data-testid="report-empty-state" />,
	ReportErrorState: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	useReportCsvExport: () => ( { canExport: false, rows: [], filename: 'referrers' } ),
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

const useRecordsMock = jest.mocked( useReferrersReportRecords );
const reportDrilldownTableMock = jest.mocked( ReportDrilldownTable );

const row: ReferrerRecord = {
	id: 'search-engines',
	label: 'Search Engines',
	views: 42,
	hasChildren: true,
};

/**
 * Stub the records hook with one populated row, settled by default.
 *
 * @param overrides - Request-state fields to override for the case under test.
 */
function mockRecords( overrides: Record< string, unknown > ) {
	useRecordsMock.mockReturnValue( {
		isError: false,
		refetch: jest.fn(),
		rows: [ row ],
		isLoading: false,
		isFetching: false,
		...overrides,
	} as unknown as ReturnType< typeof useReferrersReportRecords > );
}

describe( 'ReferrersReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'keeps the loading table on first load, before any referrers arrive', () => {
		mockRecords( { rows: [], isLoading: true, isFetching: true } );

		render( <ReferrersReportPage /> );

		expect( screen.queryByTestId( 'report-empty-state' ) ).not.toBeInTheDocument();
		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [], isLoading: true } )
		);
	} );

	it( 'shows the referrers table once the period has rows', () => {
		mockRecords( {} );

		render( <ReferrersReportPage /> );

		expect( screen.queryByTestId( 'report-empty-state' ) ).not.toBeInTheDocument();
		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [ row ] } )
		);
	} );

	it( 'replaces the referrers table with the empty state when the period has no referrers', () => {
		mockRecords( { rows: [] } );

		render( <ReferrersReportPage /> );

		expect( screen.getByTestId( 'report-empty-state' ) ).toBeInTheDocument();
		expect( reportDrilldownTableMock ).not.toHaveBeenCalled();
	} );
} );
