/**
 * External dependencies
 */
import {
	ReportCsvAction,
	ReportErrorState,
	ReportPerformanceChart,
	ReportRecordsTable,
	useReportCsvExport,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { useVideosReportRecords } from './config';
import VideosReportPage from './page';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getVideoRowId: ( item: { id?: number | string | null } ) => String( item.id ),
	getVideosFields: () => [],
	useVideosReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	formatLegendLabels: () => [],
	ReportErrorState: jest.fn( ( { title, onRetry }: { title: string; onRetry: () => void } ) => (
		<div data-testid="report-error-state">
			<span>{ title }</span>
			<button onClick={ onRetry }>Retry</button>
		</div>
	) ),
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<>
			{ actions ? <div data-testid="page-actions">{ actions }</div> : null }
			{ children }
		</>
	),
	ReportPerformanceChart: jest.fn( () => null ),
	ReportRecordsTable: jest.fn( () => null ),
	ReportCsvAction: jest.fn( () => <button>Download</button> ),
	useReportCsvExport: jest.fn(),
	useReportRetry: ( refetch: () => unknown ) => () => {
		void refetch();
	},
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	useSearch: () => ( {
		from: '2026-06-01T00:00:00+02:00',
		to: '2026-06-30T23:59:59+02:00',
		interval: 'day',
	} ),
} ) );

const useRecordsMock = jest.mocked( useVideosReportRecords );
const useReportCsvExportMock = jest.mocked( useReportCsvExport );
const reportCsvActionMock = jest.mocked( ReportCsvAction );
const reportErrorStateMock = jest.mocked( ReportErrorState );
const reportPerformanceChartMock = jest.mocked( ReportPerformanceChart );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

/**
 * Build the report records used by the page test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked records hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useVideosReportRecords > > = {} ) {
	return {
		isError: false,
		refetch: jest.fn(),
		chart: {
			primary: undefined,
			comparison: undefined,
			isLoading: false,
		},
		rows: [],
		isLoading: false,
		...overrides,
	} as ReturnType< typeof useVideosReportRecords >;
}

describe( 'VideosReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useReportCsvExportMock.mockReturnValue( {
			canExport: false,
			rows: [],
			filename: 'videos',
		} );
	} );

	it( 'renders the chart and records table when the report succeeds', () => {
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <VideosReportPage /> );

		expect( reportPerformanceChartMock ).toHaveBeenCalled();
		expect( reportRecordsTableMock ).toHaveBeenCalled();
		expect( reportErrorStateMock ).not.toHaveBeenCalled();
	} );

	it( 'wires loaded video rows into the page export action', () => {
		const rows = [
			{
				id: 441,
				label: 'Demo',
				plays: 13,
				impressions: 22,
				watch_time: 0.04,
				retention_rate: 64.5,
				link: 'https://example.com/video/441',
				children: null,
			},
		];
		const records = buildRecords( { rows } );
		useRecordsMock.mockReturnValue( records );
		useReportCsvExportMock.mockReturnValue( {
			canExport: true,
			rows,
			filename: 'videos-2026-06-01_2026-06-30',
		} );

		render( <VideosReportPage /> );

		expect( screen.getByTestId( 'page-actions' ) ).toHaveTextContent( 'Download' );
		expect( useReportCsvExportMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				rows,
				filenamePrefix: 'videos',
				status: records,
				sort: expect.any( Function ),
			} )
		);

		const { columns } = reportCsvActionMock.mock.calls[ 0 ][ 0 ];
		expect( columns.map( column => column.getValue( rows[ 0 ] ) ) ).toEqual( [
			'Demo',
			13,
			22,
			'https://example.com/video/441',
		] );
		expect( reportCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				rows,
				filename: 'videos-2026-06-01_2026-06-30',
			} )
		);
	} );

	it( 'renders the error state instead of the chart and records table', () => {
		useRecordsMock.mockReturnValue( buildRecords( { isError: true } ) );

		render( <VideosReportPage /> );

		expect( screen.getByTestId( 'report-error-state' ) ).toHaveTextContent(
			'Unable to load videos'
		);
		expect( reportPerformanceChartMock ).not.toHaveBeenCalled();
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
	} );

	it( 'refetches the report when Retry is clicked', async () => {
		const records = buildRecords( { isError: true } );
		useRecordsMock.mockReturnValue( records );

		render( <VideosReportPage /> );
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( records.refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
