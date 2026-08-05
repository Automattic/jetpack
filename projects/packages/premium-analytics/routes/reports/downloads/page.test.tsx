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
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportCsvAction: () => null,
	ReportErrorState: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportRecordsTable: jest.fn( () => null ),
	useReportCsvExport: () => ( { canExport: false, rows: [], filename: 'file-downloads' } ),
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

	it( 'reports the loading state on first load, when there is nothing to show yet', () => {
		useRecordsMock.mockReturnValue( {
			isError: false,
			refetch: jest.fn(),
			rows: [],
			hasComparison: false,
			isLoading: true,
			isFetching: true,
		} as unknown as ReturnType< typeof useDownloadsReportRecords > );

		render( <DownloadsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: [],
				isLoading: true,
			} )
		);
	} );

	it( 'keeps the rows on screen while a background refetch is in flight', () => {
		// The queries carry `placeholderData`, so a refetch triggered by a date or
		// comparison change still has the previous rows. Handing the table an empty
		// set would drop the user's search, sorting, and page position mid-refetch,
		// so the rows stay mounted and only the loading state reflects the refetch.
		useRecordsMock.mockReturnValue( {
			isError: false,
			refetch: jest.fn(),
			rows: [ row ],
			hasComparison: true,
			isLoading: false,
			isFetching: true,
		} as unknown as ReturnType< typeof useDownloadsReportRecords > );

		render( <DownloadsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: [ row ],
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
