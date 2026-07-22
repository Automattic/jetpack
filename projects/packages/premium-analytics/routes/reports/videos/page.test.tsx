/**
 * External dependencies
 */
import {
	ReportErrorState,
	ReportPerformanceChart,
	ReportRecordsTable,
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
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPerformanceChart: jest.fn( () => null ),
	ReportRecordsTable: jest.fn( () => null ),
	useReportCsvExport: () => ( {
		canExport: false,
		rows: [],
		filename: 'videos',
	} ),
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
	} );

	it( 'renders the chart and records table when the report succeeds', () => {
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <VideosReportPage /> );

		expect( reportPerformanceChartMock ).toHaveBeenCalled();
		expect( reportRecordsTableMock ).toHaveBeenCalled();
		expect( reportErrorStateMock ).not.toHaveBeenCalled();
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
