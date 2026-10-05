/**
 * External dependencies
 */
import { usePostThumbnails } from '@jetpack-premium-analytics/data';
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ExporterCsvAction,
	ReportDrilldownTable,
	ReportRecordsTable,
	archivesCsvExporter,
	postsPagesCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../tests/js/notice-test-utils';
import { usePostsReportRecords } from './config';
import PostsReportPage from './page';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	usePostsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	usePostThumbnails: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...( () => {
		const actual = jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' );
		return {
			archivesCsvExporter: actual.archivesCsvExporter,
			postsPagesCsvExporter: actual.postsPagesCsvExporter,
		};
	} )(),
	formatLegendLabels: () => [],
	PageNotice: jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ).PageNotice,
	describeError: jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ).describeError,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<>
			{ actions ? <div data-testid="page-actions">{ actions }</div> : null }
			{ children }
		</>
	),
	ReportPageTabs: () => null,
	ReportDrilldownTable: jest.fn( () => null ),
	ReportRecordsTable: jest.fn( () => null ),
	ExporterCsvAction: jest.fn( () => <button>Download</button> ),
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
const usePostThumbnailsMock = jest.mocked( usePostThumbnails );
const useSectionTabMock = jest.mocked( useSectionTab );
const exporterCsvActionMock = jest.mocked( ExporterCsvAction );
const reportDrilldownTableMock = jest.mocked( ReportDrilldownTable );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

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
		error: null,
		refetch: jest.fn(),
		posts: {
			rows: [
				{
					id: 42,
					label: 'Hello world',
					views: 12,
					link: 'https://example.com/hello-world',
					type: 'post',
				},
			],
			hasComparison: false,
			isLoading,
			isFetching,
			isError,
		},
		archives: {
			items: [],
			rows: [],
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: false,
		},
	} as ReturnType< typeof usePostsReportRecords >;
}

describe( 'PostsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		usePostThumbnailsMock.mockReturnValue( {} );
		useSectionTabMock.mockReturnValue( [ 'posts-pages', jest.fn() ] );
	} );

	it( 'wires the Posts & pages export into the page actions area', () => {
		const records = buildRecords();
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect(
			within( screen.getByTestId( 'page-actions' ) ).getByRole( 'button' )
		).toHaveTextContent( 'Download' );
		expect( exporterCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				exporter: postsPagesCsvExporter,
				items: records.posts.rows,
				status: records.posts,
				reportParams: expect.objectContaining( {
					from: '2026-06-01T00:00:00+02:00',
					to: '2026-06-30T23:59:59+02:00',
				} ),
			} )
		);
	} );

	it( 'shows the Posts table loading while the active report is fetching', () => {
		useRecordsMock.mockReturnValue( buildRecords( { isFetching: true } ) );

		render( <PostsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ].isFetching ).toBe( true );
	} );

	it( 'resolves thumbnails for the visible posts page', () => {
		const records = buildRecords();
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( usePostThumbnailsMock ).toHaveBeenCalledWith( [] );

		act( () => {
			reportRecordsTableMock.mock.calls[ 0 ][ 0 ].onChangePageItems?.( records.posts.rows );
		} );

		expect( usePostThumbnailsMock ).toHaveBeenLastCalledWith( records.posts.rows );
	} );

	it( 'draws each post thumbnail beside its title', () => {
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <PostsReportPage /> );

		const { fields, initialView } = reportRecordsTableMock.mock.calls[ 0 ][ 0 ];
		expect( initialView ).toMatchObject( { titleField: 'title', mediaField: 'thumbnail' } );
		expect( fields.map( field => field.id ) ).toEqual(
			expect.arrayContaining( [ 'title', 'thumbnail' ] )
		);
	} );

	it( 'wires the Archives export to the archives tree', () => {
		const records = buildRecords();
		records.archives.items = [
			{ label: 'cat', value: 8, link: 'https://example.com/category/news', children: null },
		] as typeof records.archives.items;
		useSectionTabMock.mockReturnValue( [ 'archives', jest.fn() ] );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( exporterCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				exporter: archivesCsvExporter,
				items: records.archives.items,
				status: records.archives,
			} )
		);
	} );

	it( 'renders Archives through the nested drilldown table', () => {
		const records = buildRecords();
		records.archives.rows = [
			{
				id: 'tags-0',
				label: 'Tags',
				views: 12,
				isGroup: true,
			},
			{
				id: 'tags-0-0',
				parentId: 'tags-0',
				label: 'Analytics',
				views: 12,
				isGroup: false,
			},
		];
		records.archives.isFetching = true;
		useSectionTabMock.mockReturnValue( [ 'archives', jest.fn() ] );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( reportDrilldownTableMock ).toHaveBeenCalledTimes( 1 );
		const drilldownProps = reportDrilldownTableMock.mock.calls[ 0 ][ 0 ];
		expect( drilldownProps ).toEqual(
			expect.objectContaining( {
				data: records.archives.rows,
				hideLevelMarkers: true,
				isFetching: true,
				searchLabel: 'Search archives',
			} )
		);
		expect( drilldownProps.getItemParentId?.( records.archives.rows[ 1 ] ) ).toBe( 'tags-0' );
		expect( drilldownProps.getItemId( records.archives.rows[ 1 ] ) ).toBe( 'tags-0-0' );
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
	} );

	it( 'renders the error state instead of the records table', () => {
		useRecordsMock.mockReturnValue( buildRecords( { isError: true } ) );

		render( <PostsReportPage /> );

		expect(
			getNoticeText( "We couldn't load posts. Please try again in a moment." )
		).toBeInTheDocument();
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
		expect( reportDrilldownTableMock ).not.toHaveBeenCalled();
	} );

	it( 'refetches the report when Retry is clicked', async () => {
		const records = buildRecords( { isError: true } );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( records.refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
