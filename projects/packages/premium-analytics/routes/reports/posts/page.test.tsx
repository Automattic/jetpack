/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ReportErrorState,
	ReportPerformanceChart,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { usePostsReportRecords } from './config';
import PostsReportPage from './page';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	usePostsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: jest.fn(),
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
	ReportPageTabs: () => null,
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
	Link: ( { children }: { children: ReactNode } ) => <a href="/post">{ children }</a>,
	useNavigate: () => jest.fn(),
	useSearch: () => ( {
		from: '2026-06-01T00:00:00+02:00',
		to: '2026-06-30T23:59:59+02:00',
		interval: 'day',
	} ),
} ) );

const useRecordsMock = jest.mocked( usePostsReportRecords );
const useSectionTabMock = jest.mocked( useSectionTab );
const useReportCsvExportMock = jest.mocked( useReportCsvExport );
const reportErrorStateMock = jest.mocked( ReportErrorState );
const reportPerformanceChartMock = jest.mocked( ReportPerformanceChart );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );
const reportCsvActionMock = jest.mocked( ReportCsvAction );

/**
 * Build the report records used by the page tests.
 *
 * @param options            - Active report request state.
 * @param options.isFetching - Whether the active report is currently refetching.
 * @param options.isLoading  - Whether the active report is initially loading.
 * @param options.isError    - Whether the active report request failed.
 * @return The mocked records hook result.
 */
function buildRecords( {
	isFetching = false,
	isLoading = false,
	isError = false,
}: {
	isFetching?: boolean;
	isLoading?: boolean;
	isError?: boolean;
} = {} ) {
	return {
		isError,
		refetch: jest.fn(),
		chart: {
			primary: undefined,
			comparison: undefined,
			isLoading: false,
		},
		posts: {
			rows: [
				{
					id: 42,
					label: 'Hello world',
					views: 12,
					link: 'https://example.com/hello-world',
				},
			],
			isLoading,
			isFetching,
			isError,
		},
		archives: {
			rows: [],
			isLoading: false,
			isFetching: false,
			isError: false,
		},
	} as ReturnType< typeof usePostsReportRecords >;
}

describe( 'PostsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSectionTabMock.mockReturnValue( [ 'posts-pages', jest.fn() ] );
		useReportCsvExportMock.mockImplementation( options => ( {
			canExport: true,
			buttonProps: {
				columns: options.columns,
				rows: options.rows,
				filename: `${ options.filenamePrefix }-2026-06-01_2026-06-30`,
			},
		} ) );
	} );

	it( 'wires the active report export into the page actions area', () => {
		const records = buildRecords();
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect(
			within( screen.getByTestId( 'page-actions' ) ).getByRole( 'button' )
		).toHaveTextContent( 'Download' );
		expect( useReportCsvExportMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				rows: records.posts.rows,
				filenamePrefix: 'top-posts',
				status: records.posts,
				sort: expect.any( Function ),
			} )
		);

		const { columns } = useReportCsvExportMock.mock.calls[ 0 ][ 0 ];
		expect( columns.map( column => column.getValue( records.posts.rows[ 0 ] ) ) ).toEqual( [
			'Hello world',
			12,
			'https://example.com/hello-world',
		] );
		expect( reportCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				filename: 'top-posts-2026-06-01_2026-06-30',
				rows: records.posts.rows,
			} )
		);
	} );

	it( 'does not render a page action when the hook disables export', () => {
		useRecordsMock.mockReturnValue( buildRecords() );
		useReportCsvExportMock.mockReturnValue( {
			canExport: false,
			buttonProps: { columns: [], rows: [], filename: 'top-posts' },
		} );

		render( <PostsReportPage /> );

		expect( screen.queryByTestId( 'page-actions' ) ).not.toBeInTheDocument();
		expect( reportCsvActionMock ).not.toHaveBeenCalled();
	} );

	it( 'configures the active Archives tab with its own rows and filename', () => {
		const records = buildRecords();
		records.archives.rows = [
			{
				id: 'category-1',
				label: '/category/news',
				views: 8,
				link: 'https://example.com/category/news',
			},
		];
		useSectionTabMock.mockReturnValue( [ 'archives', jest.fn() ] );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( useReportCsvExportMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				rows: records.archives.rows,
				filenamePrefix: 'archives',
				status: records.archives,
			} )
		);
		const { columns } = useReportCsvExportMock.mock.calls[ 0 ][ 0 ];
		expect( columns.map( column => column.getValue( records.archives.rows[ 0 ] ) ) ).toEqual( [
			'/category/news',
			8,
			'https://example.com/category/news',
		] );
	} );

	it( 'renders the error state instead of the chart and records table', () => {
		useRecordsMock.mockReturnValue( buildRecords( { isError: true } ) );

		render( <PostsReportPage /> );

		expect( screen.getByTestId( 'report-error-state' ) ).toHaveTextContent(
			'Unable to load posts'
		);
		expect( reportErrorStateMock ).toHaveBeenCalled();
		expect( reportPerformanceChartMock ).not.toHaveBeenCalled();
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
	} );

	it( 'refetches the report when Retry is clicked', async () => {
		const records = buildRecords( { isError: true } );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( records.refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
