/**
 * External dependencies
 */
import {
	ReportCsvAction,
	ReportDrilldownTable,
	ReportRecordsTable,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useClicksReportRecords } from './clicks/config';
import ClicksReportPage from './clicks/page';
import { useCommentFollowersReportRecords } from './comment-followers/config';
import CommentFollowersReportPage from './comment-followers/page';
import { useDownloadsReportRecords } from './downloads/config';
import DownloadsReportPage from './downloads/page';
import { useSearchTermsReportRecords } from './search-terms/config';
import SearchTermsReportPage from './search-terms/page';
import { useUtmReportRecords } from './utm/config';
import UtmReportPage from './utm/page';
import type { StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';
import type { ComponentType, ReactNode } from 'react';

jest.mock( './clicks/config', () => ( {
	getClicksFields: () => [],
	useClicksReportRecords: jest.fn(),
} ) );

jest.mock( './comment-followers/config', () => ( {
	...jest.requireActual( './comment-followers/config' ),
	useCommentFollowersReportRecords: jest.fn(),
} ) );

jest.mock( './downloads/config', () => ( {
	getDownloadsFields: () => [],
	useDownloadsReportRecords: jest.fn(),
} ) );

jest.mock( './search-terms/config', () => ( {
	getSearchTermsFields: () => [],
	useSearchTermsReportRecords: jest.fn(),
} ) );

jest.mock( './utm/config', () => ( {
	getReportUtmTabs: () => [ { id: 'source-medium', label: 'Source / medium' } ],
	getUtmFields: () => [],
	getUtmTabLabel: () => 'Source / medium',
	resolveSection: ( value: string | undefined ) => value ?? 'source-medium',
	useUtmReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: () => [ 'source-medium', jest.fn() ],
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: () => null,
} ) );

// The records table stays real for the Comments Subscribers rows; the spy exposes its props.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' );

	return {
		...actual,
		ExporterCsvAction: () => null,
		ReportCsvAction: jest.fn( () => null ),
		ReportDrilldownTable: jest.fn( () => null ),
		ReportPageTabs: () => null,
		ReportRecordsTable: jest.fn( actual.ReportRecordsTable ),
	};
} );

// `Breadcrumbs` and the post-title `Link` both reach for router context these tests do not provide.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( { children }: { children: ReactNode } ) => <a href="/post">{ children }</a>,
	useSearch: () => ( {
		from: '2026-06-01',
		to: '2026-06-07',
		interval: 'day',
	} ),
} ) );

type RecordsState = {
	rows: unknown[];
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
};

type PageCase = {
	name: string;
	Page: ComponentType;
	hook: jest.Mock;
	table: jest.Mock;
	records: ( state: RecordsState ) => unknown;
	row: unknown;
	tableProps: Record< string, unknown >;
	retryCopy: string;
};

const folded = { collapsible: true, defaultExpanded: 'none' };

const clicks: PageCase = {
	name: 'Clicks',
	Page: ClicksReportPage,
	hook: jest.mocked( useClicksReportRecords ),
	table: jest.mocked( ReportDrilldownTable ),
	records: state => state,
	row: { id: 'wordpress.org', clickedUrl: 'wordpress.org', isGroup: true, clicks: 42 },
	tableProps: folded,
	retryCopy: "We couldn't load clicks. Please try again in a moment.",
};

const searchTerms: PageCase = {
	name: 'Search terms',
	Page: SearchTermsReportPage,
	hook: jest.mocked( useSearchTermsReportRecords ),
	table: jest.mocked( ReportRecordsTable ),
	records: ( { isError, refetch, ...table } ) => ( { isError, refetch, table } ),
	row: { id: 'jetpack search', term: 'jetpack search', views: 42 },
	tableProps: {},
	retryCopy: "We couldn't load search terms. Please try again in a moment.",
};

const downloads: PageCase = {
	name: 'File downloads',
	Page: DownloadsReportPage,
	hook: jest.mocked( useDownloadsReportRecords ),
	table: jest.mocked( ReportRecordsTable ),
	records: state => state,
	row: {
		label: '/files/report.pdf',
		shortLabel: 'report.pdf',
		link: 'https://example.com/files/report.pdf',
		downloads: 13,
		children: null,
	},
	tableProps: {},
	retryCopy: "We couldn't load file downloads. Please try again in a moment.",
};

const utm: PageCase = {
	name: 'UTM',
	Page: UtmReportPage,
	hook: jest.mocked( useUtmReportRecords ),
	table: jest.mocked( ReportDrilldownTable ),
	records: state => state,
	row: { id: 'utm_source=newsletter', label: 'newsletter', isGroup: true, views: 42 },
	tableProps: folded,
	retryCopy: "We couldn't load UTM data. Please try again in a moment.",
};

/**
 * Stub a page's records hook with its one row, settled by default.
 *
 * @param page      - The page under test.
 * @param overrides - Request-state fields to override for the case under test.
 */
function mockRecords( page: PageCase, overrides: Partial< RecordsState > ) {
	page.hook.mockReturnValue(
		page.records( {
			rows: [ page.row ],
			hasComparison: true,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
			...overrides,
		} )
	);
}

describe( 'dated report pages', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [ clicks, searchTerms, downloads ] )(
		'$name reports the loading state on first load, when there is nothing to show yet',
		page => {
			mockRecords( page, { rows: [], hasComparison: false, isLoading: true, isFetching: true } );

			render( <page.Page /> );

			expect( page.table.mock.lastCall?.[ 0 ] ).toEqual(
				expect.objectContaining( { data: [], isLoading: true } )
			);
		}
	);

	// `placeholderData` keeps the previous rows during a refetch, so search, sort and
	// expanded state survive a date or comparison change instead of resetting.
	it.each( [ clicks, searchTerms, downloads, utm ] )(
		'$name keeps its rows on screen while a background refetch is in flight',
		page => {
			mockRecords( page, { isFetching: true } );

			render( <page.Page /> );

			expect( page.table.mock.lastCall?.[ 0 ] ).toEqual(
				expect.objectContaining( {
					data: [ page.row ],
					isLoading: false,
					isFetching: true,
					...page.tableProps,
				} )
			);
		}
	);
} );

describe( 'CommentFollowersReportPage', () => {
	const useRecordsMock = jest.mocked( useCommentFollowersReportRecords );
	const helloWorld = { id: 1, label: 'Hello world', followers: 12, value: 12, children: null };

	/**
	 * Build a records-hook return value for the page under test.
	 *
	 * @param overrides - The fields to override on the successful-empty default.
	 * @return The mocked hook result.
	 */
	function buildRecords(
		overrides: Partial< ReturnType< typeof useCommentFollowersReportRecords > >
	) {
		return {
			rows: [],
			allPostsFollowers: undefined,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
			...overrides,
		} as ReturnType< typeof useCommentFollowersReportRecords >;
	}

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows the All Posts summary and rows on success', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( { rows: [ helloWorld ], allPostsFollowers: 20 } )
		);

		render( <CommentFollowersReportPage /> );

		expect( screen.getByText( 'All Posts' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Hello world' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'hides the All Posts summary when there are no subscribers', () => {
		useRecordsMock.mockReturnValue( buildRecords( { allPostsFollowers: 0 } ) );

		render( <CommentFollowersReportPage /> );

		expect( screen.queryByText( 'All Posts' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'No data found' } ) ).toBeInTheDocument();
	} );

	it( 'shows the All Posts count on its own when no single post has subscribers', () => {
		useRecordsMock.mockReturnValue( buildRecords( { allPostsFollowers: 20 } ) );

		render( <CommentFollowersReportPage /> );

		expect( screen.getByText( 'All Posts' ) ).toBeInTheDocument();
		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'No data found' } ) ).not.toBeInTheDocument();
	} );

	it( 'exports posts by subscriber count, most first', () => {
		const rows = [
			{ id: 1, label: 'First post', followers: 2, link: '/first', value: 2, children: null },
			{ id: 2, label: 'Second post', followers: 5, link: '/second', value: 5, children: null },
		];
		useRecordsMock.mockReturnValue( buildRecords( { rows, allPostsFollowers: 7 } ) );

		render( <CommentFollowersReportPage /> );

		const action = jest.mocked( ReportCsvAction ).mock.lastCall?.[ 0 ] as unknown as {
			columns: CsvColumn< StatsCommentFollowersItem >[];
			rows: StatsCommentFollowersItem[];
			filename: string;
		};
		expect( action.filename ).toBe( 'comment-subscribers' );
		expect( action.rows ).toEqual( [ rows[ 1 ], rows[ 0 ] ] );
		expect( action.columns.map( column => column.getValue( action.rows[ 0 ] ) ) ).toEqual( [
			'Second post',
			5,
			'/second',
		] );
	} );
} );
