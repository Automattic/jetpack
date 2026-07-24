/**
 * External dependencies
 */
import { ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useDownloadsReportRecords } from './config';
import DownloadsReportPage from './page';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getDownloadsFields: () => [],
	useDownloadsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportErrorState: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportRecordsTable: jest.fn( () => null ),
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

const useRecordsMock = jest.mocked( useDownloadsReportRecords );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

const row = {
	label: '/files/report.pdf',
	shortLabel: 'report.pdf',
	link: 'https://example.com/files/report.pdf',
	downloads: 13,
	linkTitle: '/files/report.pdf',
	labelIcon: 'external',
	children: null,
};

describe( 'DownloadsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [
		[ 'initial loading', true, false ],
		[ 'active fetching', false, true ],
	] )( 'hides stale rows during %s', ( _label, isLoading, isFetching ) => {
		useRecordsMock.mockReturnValue( {
			isError: false,
			refetch: jest.fn(),
			rows: [ row ],
			hasComparison: true,
			isLoading,
			isFetching,
		} as ReturnType< typeof useDownloadsReportRecords > );

		render( <DownloadsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: [],
				isLoading: true,
			} )
		);
	} );

	it( 'shows current rows once both requests are settled', () => {
		useRecordsMock.mockReturnValue( {
			isError: false,
			refetch: jest.fn(),
			rows: [ row ],
			hasComparison: true,
			isLoading: false,
			isFetching: false,
		} as ReturnType< typeof useDownloadsReportRecords > );

		render( <DownloadsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: [ row ],
				isLoading: false,
			} )
		);
	} );
} );
