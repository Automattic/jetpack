/**
 * External dependencies
 */
import { ReportDrilldownTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useClicksReportRecords } from './config';
import ClicksReportPage from './page';
import type { ClickRow } from './config';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getClicksFields: () => [],
	useClicksReportRecords: jest.fn(),
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
	ReportErrorState: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	useReportCsvExport: () => ( { canExport: false, rows: [], filename: 'clicks' } ),
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

const useRecordsMock = jest.mocked( useClicksReportRecords );
const reportDrilldownTableMock = jest.mocked( ReportDrilldownTable );

const row: ClickRow = {
	id: 'wordpress.org',
	clickedUrl: 'wordpress.org',
	isGroup: true,
	clicks: 42,
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
		hasComparison: true,
		isLoading: false,
		isFetching: false,
		...overrides,
	} as unknown as ReturnType< typeof useClicksReportRecords > );
}

describe( 'ClicksReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'reports the loading state on first load, when there is nothing to show yet', () => {
		mockRecords( { rows: [], hasComparison: false, isLoading: true, isFetching: true } );

		render( <ClicksReportPage /> );

		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [], isLoading: true } )
		);
	} );

	it( 'keeps the rows on screen while a background refetch is in flight', () => {
		// `placeholderData` keeps the previous rows during a refetch, so search/sort/
		// expanded state survive a date or comparison change instead of resetting.
		mockRecords( { isFetching: true } );

		render( <ClicksReportPage /> );

		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [ row ], isLoading: true } )
		);
	} );

	it( 'shows current rows once the requests are settled', () => {
		mockRecords( {} );

		render( <ClicksReportPage /> );

		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [ row ], isLoading: false } )
		);
	} );
} );
