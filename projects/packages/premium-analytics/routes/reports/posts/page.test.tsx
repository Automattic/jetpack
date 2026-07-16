/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	isCsvExportEnabled,
	RowsCsvDownloadButton,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen, within } from '@testing-library/react';
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
	isCsvExportEnabled: jest.fn(),
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageTabs: () => null,
	ReportPerformanceChart: () => null,
	ReportRecordsTable: () => null,
	RowsCsvDownloadButton: jest.fn( ( { label }: { label: string } ) => <button>{ label }</button> ),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
	Page: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<>
			{ actions ? <div data-testid="page-actions">{ actions }</div> : null }
			{ children }
		</>
	),
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
const csvExportEnabledMock = jest.mocked( isCsvExportEnabled );
const rowsCsvDownloadButtonMock = jest.mocked( RowsCsvDownloadButton );

/**
 * Build the report records used by the page test.
 *
 * @param isFetching - Whether the active report is currently refetching.
 * @return The mocked records hook result.
 */
function buildRecords( isFetching = false ) {
	return {
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
			isLoading: false,
			isFetching,
			isError: false,
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
		csvExportEnabledMock.mockReturnValue( true );
		useSectionTabMock.mockReturnValue( [ 'posts-pages', jest.fn() ] );
	} );

	it( 'places the active report export in the page actions area', () => {
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <PostsReportPage /> );

		expect(
			within( screen.getByTestId( 'page-actions' ) ).getByRole( 'button' )
		).toHaveTextContent( 'Download' );
		expect( rowsCsvDownloadButtonMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Download',
				variant: 'solid',
				showIcon: false,
				filename: 'top-posts-2026-06-01_2026-06-30',
				rows: [
					{
						title: 'Hello world',
						views: 12,
						url: 'https://example.com/hello-world',
					},
				],
			} )
		);
	} );

	it( 'orders exported rows by views descending', () => {
		const records = buildRecords();
		records.posts.rows.unshift( {
			id: 43,
			label: 'Lower traffic',
			views: 4,
			link: 'https://example.com/lower-traffic',
		} );
		records.posts.rows.push( {
			id: 44,
			label: 'Most traffic',
			views: 20,
			link: 'https://example.com/most-traffic',
		} );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( rowsCsvDownloadButtonMock.mock.calls[ 0 ][ 0 ].rows ).toEqual( [
			{
				title: 'Most traffic',
				views: 20,
				url: 'https://example.com/most-traffic',
			},
			{
				title: 'Hello world',
				views: 12,
				url: 'https://example.com/hello-world',
			},
			{
				title: 'Lower traffic',
				views: 4,
				url: 'https://example.com/lower-traffic',
			},
		] );
	} );

	it( 'hides the export while the active report is fetching', () => {
		useRecordsMock.mockReturnValue( buildRecords( true ) );

		render( <PostsReportPage /> );

		expect( screen.queryByTestId( 'page-actions' ) ).not.toBeInTheDocument();
	} );

	it( 'does not create a page actions area while CSV exports are disabled', () => {
		csvExportEnabledMock.mockReturnValue( false );
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <PostsReportPage /> );

		expect( screen.queryByTestId( 'page-actions' ) ).not.toBeInTheDocument();
		expect( rowsCsvDownloadButtonMock ).not.toHaveBeenCalled();
	} );

	it( 'exports the active Archives tab with its own filename', () => {
		const records = buildRecords();
		records.posts.rows = [];
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

		expect( rowsCsvDownloadButtonMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				filename: 'archives-2026-06-01_2026-06-30',
				rows: [
					{
						title: '/category/news',
						views: 8,
						url: 'https://example.com/category/news',
					},
				],
			} )
		);
	} );
} );
