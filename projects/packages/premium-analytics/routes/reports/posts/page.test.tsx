/**
 * External dependencies
 */
import { usePostThumbnails } from '@jetpack-premium-analytics/data';
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ExporterCsvAction,
	ReportDrilldownTable,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render } from '@testing-library/react';
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
	ReportErrorState: jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' )
		.ReportErrorState,
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
 * @return The mocked records hook result.
 */
function buildRecords( {
	isFetching = false,
	isLoading = false,
}: {
	isFetching?: boolean;
	isLoading?: boolean;
} = {} ) {
	return {
		isError: false,
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
			isError: false,
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

	it( 'gives the Posts & pages export the posts request status', () => {
		const records = buildRecords();
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( exporterCsvActionMock.mock.calls[ 0 ][ 0 ].status ).toBe( records.posts );
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

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ].initialView ).toMatchObject( {
			titleField: 'title',
			mediaField: 'thumbnail',
		} );
	} );

	it( 'gives the Archives export the archives request status', () => {
		const records = buildRecords();
		useSectionTabMock.mockReturnValue( [ 'archives', jest.fn() ] );
		useRecordsMock.mockReturnValue( records );

		render( <PostsReportPage /> );

		expect( exporterCsvActionMock.mock.calls[ 0 ][ 0 ].status ).toBe( records.archives );
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
} );
