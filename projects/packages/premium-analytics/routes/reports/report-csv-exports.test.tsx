/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ReportCsvAction,
	useReportCsvExport,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useAnnualInsightsReportRecords } from './annual-insights/config';
import AnnualInsightsReportPage from './annual-insights/page';
import { useClicksReportRecords } from './clicks/config';
import ClicksReportPage from './clicks/page';
import { useCommentFollowersReportRecords } from './comment-followers/config';
import CommentFollowersReportPage from './comment-followers/page';
import { useCommentsReportRecords } from './comments/config';
import CommentsReportPage from './comments/page';
import { useDownloadsReportRecords } from './downloads/config';
import DownloadsReportPage from './downloads/page';
import { useEmailsReportRecords } from './emails/config';
import EmailsReportPage from './emails/page';
import { useLocationsReportRecords } from './locations/config';
import LocationsReportPage from './locations/page';
import { useReferrersReportRecords } from './referrers/config';
import ReferrersReportPage from './referrers/page';
import { useSearchTermsReportRecords } from './search-terms/config';
import SearchTermsReportPage from './search-terms/page';
import { useTagsReportRecords } from './tags/config';
import TagsReportPage from './tags/page';
import { useUtmReportRecords } from './utm/config';
import UtmReportPage from './utm/page';
import type { ComponentType, ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	normalizeReportParams: ( search: Record< string, unknown > ) => ( {
		...search,
		interval: 'day',
	} ),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => {
	const Container = ( {
		actions,
		children,
		filters,
		tabs,
	}: {
		actions?: ReactNode;
		children?: ReactNode;
		filters?: ReactNode;
		tabs?: ReactNode;
	} ) => (
		<>
			{ actions }
			{ tabs }
			{ filters }
			{ children }
		</>
	);

	return {
		MetricValue: () => null,
		ReportCsvAction: jest.fn( () => null ),
		ReportDrilldownTable: () => null,
		ReportErrorState: () => null,
		ReportPageLayout: Container,
		ReportPageSection: Container,
		ReportPageShell: Container,
		ReportPageTabs: () => null,
		ReportPerformanceChart: () => null,
		ReportRecordsTable: () => null,
		formatLegendLabels: () => ( {} ),
		useReportCsvExport: jest.fn(),
		useReportRetry: ( refetch: () => void ) => refetch,
	};
} );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
	Page: ( { actions, children }: { actions?: ReactNode; children?: ReactNode } ) => (
		<>
			{ actions }
			{ children }
		</>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
	useNavigate: () => jest.fn(),
	useSearch: () => ( {} ),
} ) );

// The page imports `EmptyState`/`Text` from the externals passthrough, so the
// stubs have to replace them there; the Proxy leaves the rest of the barrel
// intact for any other consumer in the graph.
jest.mock(
	'@jetpack-premium-analytics/externals',
	() =>
		new Proxy(
			{
				EmptyState: {
					Root: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
					Title: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
				},
				Text: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
			},
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@jetpack-premium-analytics/externals' )[ prop ],
			}
		)
);

jest.mock( './annual-insights/config', () => ( {
	getAnnualInsightsFields: () => [],
	useAnnualInsightsReportRecords: jest.fn(),
} ) );

jest.mock( './clicks/config', () => ( {
	getClickCsvGroup: () => 'Social',
	getClicksFields: () => [],
	useClicksReportRecords: jest.fn(),
} ) );

jest.mock( './comment-followers/config', () => ( {
	getCommentFollowersFields: () => [],
	useCommentFollowersReportRecords: jest.fn(),
} ) );

jest.mock( './comments/config', () => ( {
	getCommentsFields: () => [],
	getCommentsReportTabs: () => [ { id: 'authors', label: 'Authors' } ],
	resolveTabId: ( value: string | undefined ) => value ?? 'authors',
	useCommentsReportRecords: jest.fn(),
} ) );

jest.mock( './downloads/config', () => ( {
	getDownloadsFields: () => [],
	useDownloadsReportRecords: jest.fn(),
} ) );

jest.mock( './emails/config', () => ( {
	getEmailsFields: () => [],
	useEmailsReportRecords: jest.fn(),
} ) );

jest.mock( './locations/config', () => ( {
	getLocationFields: () => [],
	getReportLocationsTabs: () => [ { id: 'countries', label: 'Countries' } ],
	resolveSection: ( value: string | undefined ) => value ?? 'countries',
	supportsCountryFilter: ( tab: string ) => tab !== 'countries',
	useLocationsReportRecords: jest.fn(),
} ) );

jest.mock( './referrers/config', () => ( {
	getReferrerFields: () => [],
	useReferrersReportRecords: jest.fn(),
} ) );

jest.mock( './search-terms/config', () => ( {
	getSearchTermsFields: () => [],
	useSearchTermsReportRecords: jest.fn(),
} ) );

jest.mock( './tags/config', () => ( {
	getTagRowId: ( item: { labelText: string } ) => item.labelText,
	getTagsFields: () => [],
	useTagsReportRecords: jest.fn(),
} ) );

jest.mock( './utm/config', () => ( {
	getReportUtmTabs: () => [ { id: 'source-medium', label: 'Source / medium' } ],
	getUtmFields: () => [],
	getUtmTabLabel: () => 'Source / medium',
	resolveSection: ( value: string | undefined ) => value ?? 'source-medium',
	useUtmReportRecords: jest.fn(),
} ) );

const useAnnualInsightsReportRecordsMock = jest.mocked( useAnnualInsightsReportRecords );
const useClicksReportRecordsMock = jest.mocked( useClicksReportRecords );
const useCommentFollowersReportRecordsMock = jest.mocked( useCommentFollowersReportRecords );
const useCommentsReportRecordsMock = jest.mocked( useCommentsReportRecords );
const useDownloadsReportRecordsMock = jest.mocked( useDownloadsReportRecords );
const useEmailsReportRecordsMock = jest.mocked( useEmailsReportRecords );
const useLocationsReportRecordsMock = jest.mocked( useLocationsReportRecords );
const useReferrersReportRecordsMock = jest.mocked( useReferrersReportRecords );
const useSearchTermsReportRecordsMock = jest.mocked( useSearchTermsReportRecords );
const useTagsReportRecordsMock = jest.mocked( useTagsReportRecords );
const useUtmReportRecordsMock = jest.mocked( useUtmReportRecords );
const useSectionTabMock = jest.mocked( useSectionTab );
const useReportCsvExportMock = jest.mocked( useReportCsvExport );
const reportCsvActionMock = jest.mocked( ReportCsvAction );

const reportStatus = {
	isLoading: false,
	isFetching: false,
	isError: false,
	refetch: jest.fn(),
};

const chart = {
	primary: [],
	comparison: undefined,
	isLoading: false,
};

type ExportOptions = {
	rows: unknown[];
	filenamePrefix: string;
	sort?: ( a: never, b: never ) => number;
};

type ExportActionProps = {
	columns: CsvColumn< unknown >[];
	rows: unknown[];
	filename: string;
};

/**
 * Render a report and assert the values passed to its CSV action.
 *
 * @param Page           - Report page component.
 * @param filenamePrefix - Expected filename prefix.
 * @param expectedRows   - Expected sorted export rows.
 * @param expectedValues - Expected CSV values for the first row.
 */
function expectCsvExport(
	Page: ComponentType,
	filenamePrefix: string,
	expectedRows: unknown[],
	expectedValues: unknown[]
) {
	render( <Page /> );

	const exportOptions = useReportCsvExportMock.mock.calls.at( -1 )?.[ 0 ] as ExportOptions;
	expect( exportOptions.filenamePrefix ).toBe( filenamePrefix );

	const actionProps = reportCsvActionMock.mock.calls.at( -1 )?.[ 0 ] as ExportActionProps;
	expect( actionProps.rows ).toEqual( expectedRows );
	expect( actionProps.filename ).toBe( 'report.csv' );
	expect( actionProps.columns.map( column => column.getValue( actionProps.rows[ 0 ] ) ) ).toEqual(
		expectedValues
	);
}

/* eslint-disable jest/expect-expect -- Assertions are centralized in expectCsvExport. */
describe( 'report CSV exports', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSectionTabMock.mockReturnValue( [ 'authors', jest.fn() ] as ReturnType<
			typeof useSectionTab
		> );
		useReportCsvExportMock.mockImplementation( options => {
			const rows = options.sort ? [ ...options.rows ].sort( options.sort ) : options.rows;

			return {
				canExport: true,
				rows,
				filename: 'report.csv',
			};
		} );
	} );

	it( 'configures the Annual insights export', () => {
		const rows = [
			{
				year: '2025',
				total_posts: 10,
				total_comments: 20,
				avg_comments: 2,
				total_likes: 30,
				avg_likes: 3,
				total_words: 1000,
				avg_words: 100,
				total_images: 4,
				avg_images: 1,
			},
			{
				year: '2026',
				total_posts: 12,
				total_comments: 24,
				avg_comments: 2,
				total_likes: 36,
				avg_likes: 3,
				total_words: 1200,
				avg_words: 100,
				total_images: 5,
				avg_images: 1,
			},
		];
		useAnnualInsightsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			rows,
		} as ReturnType< typeof useAnnualInsightsReportRecords > );

		expectCsvExport(
			AnnualInsightsReportPage,
			'annual-insights',
			[ rows[ 1 ], rows[ 0 ] ],
			[ '2026', 12, 24, 2, 36, 3, 1200, 100 ]
		);
	} );

	it( 'configures the Clicks export with parent rows in hierarchy order', () => {
		const group = { id: 'social', clickedUrl: 'Social', isGroup: true, clicks: 10 };
		const lowerRow = {
			id: 'social|a',
			parentId: 'social',
			clickedUrl: 'https://example.com/a',
			isGroup: false,
			clicks: 3,
		};
		const higherRow = {
			id: 'social|b',
			parentId: 'social',
			clickedUrl: 'https://example.com/b',
			isGroup: false,
			clicks: 7,
		};
		useClicksReportRecordsMock.mockReturnValue( {
			...reportStatus,
			chart,
			rows: [ group, higherRow, lowerRow ],
		} as unknown as ReturnType< typeof useClicksReportRecords > );

		expectCsvExport(
			ClicksReportPage,
			'clicks',
			[
				{ ...group, group: '' },
				{ ...higherRow, group: 'Social' },
				{ ...lowerRow, group: 'Social' },
			],
			[ 'Social', '', 10 ]
		);
	} );

	it( 'configures the Comments Subscribers export', () => {
		const rows = [
			{ id: 1, label: 'First post', followers: 2, link: '/first', value: 2, children: null },
			{ id: 2, label: 'Second post', followers: 5, link: '/second', value: 5, children: null },
		];
		useCommentFollowersReportRecordsMock.mockReturnValue( {
			...reportStatus,
			allPostsFollowers: 7,
			rows,
		} as ReturnType< typeof useCommentFollowersReportRecords > );

		expectCsvExport(
			CommentFollowersReportPage,
			'comment-subscribers',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Second post', 5, '/second' ]
		);
	} );

	it( 'configures the active Comments tab export', () => {
		const rows = [
			{ id: 'first', label: 'First author', value: 2, link: '/first' },
			{ id: 'second', label: 'Second author', value: 5, link: '/second' },
		];
		useCommentsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			rows,
		} as ReturnType< typeof useCommentsReportRecords > );

		expectCsvExport(
			CommentsReportPage,
			'comments-authors',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Second author', 5, '/second' ]
		);
	} );

	it( 'configures the File downloads export', () => {
		const rows = [
			{ label: 'First file', shortLabel: 'first.pdf', downloads: 2, link: '/first.pdf' },
			{ label: 'Second file', shortLabel: 'second.pdf', downloads: 5, link: '/second.pdf' },
		];
		useDownloadsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			chart,
			rows,
		} as unknown as ReturnType< typeof useDownloadsReportRecords > );

		expectCsvExport(
			DownloadsReportPage,
			'file-downloads',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'second.pdf', 5, '/second.pdf' ]
		);
	} );

	it( 'configures the Emails export', () => {
		const rows = [
			{
				id: 1,
				label: 'First email',
				date: '2026-01-01',
				opens: 10,
				opens_rate: 20,
				clicks: 2,
				clicks_rate: 4,
			},
			{
				id: 2,
				label: 'Second email',
				date: '2026-02-01',
				opens: 20,
				opens_rate: 40,
				clicks: 4,
				clicks_rate: 8,
			},
		];
		useEmailsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			rows,
		} as unknown as ReturnType< typeof useEmailsReportRecords > );

		expectCsvExport(
			EmailsReportPage,
			'emails',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Second email', '2026-02-01', 20, 40, 4, 8 ]
		);
	} );

	it( 'configures the Referrers export in hierarchy order', () => {
		const rows = [
			{ id: 'search', label: 'Search', views: 10 },
			{
				id: 'search|first',
				parentId: 'search',
				label: 'First source',
				parentLabel: 'Search',
				views: 2,
				link: '/first',
			},
			{ id: 'social', label: 'Social', views: 5 },
		];
		useReferrersReportRecordsMock.mockReturnValue( {
			...reportStatus,
			rows,
		} as ReturnType< typeof useReferrersReportRecords > );

		expectCsvExport( ReferrersReportPage, 'referrers', rows, [ 'Search', '', 10, '' ] );
	} );

	it( 'configures the Locations export', () => {
		const rows = [
			{ id: 'IN:India', label: 'India', countryCode: 'IN', countryFull: 'India', views: 2 },
			{
				id: 'AU:Australia',
				label: 'Australia',
				countryCode: 'AU',
				countryFull: 'Australia',
				views: 5,
			},
		];
		useSectionTabMock.mockReturnValue( [ 'countries', jest.fn() ] as unknown as ReturnType<
			typeof useSectionTab
		> );
		useLocationsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			hasComparison: false,
			countries: { options: [] },
			table: {
				...reportStatus,
				rows,
			},
		} as unknown as ReturnType< typeof useLocationsReportRecords > );

		expectCsvExport(
			LocationsReportPage,
			'locations-countries',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Australia', 5 ]
		);
	} );

	it( 'configures the Search terms export', () => {
		const rows = [
			{ id: 'first', term: 'first term', views: 2 },
			{ id: 'second', term: 'second term', views: 5 },
		];
		useSearchTermsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			chart,
			table: {
				...reportStatus,
				rows,
			},
		} as unknown as ReturnType< typeof useSearchTermsReportRecords > );

		expectCsvExport(
			SearchTermsReportPage,
			'search-terms',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'second term', 5 ]
		);
	} );

	it( 'configures the Tags and categories export', () => {
		const rows = [
			{ label: 'First tag', labelText: 'First tag', value: 2, link: '/first' },
			{ label: 'Second tag', labelText: 'Second tag', value: 5, link: '/second' },
		];
		useTagsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			rows,
		} as unknown as ReturnType< typeof useTagsReportRecords > );

		expectCsvExport(
			TagsReportPage,
			'tags-and-categories',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Second tag', 5, '/second' ]
		);
	} );

	it( 'configures the active UTM tab export in hierarchy order', () => {
		useSectionTabMock.mockReturnValue( [ 'source-medium', jest.fn() ] as ReturnType<
			typeof useSectionTab
		> );
		const rows = [
			{ id: 'first', label: 'First source', views: 2, isGroup: true },
			{
				id: 'first-post',
				parentId: 'first',
				label: 'First post',
				groupLabel: 'First source',
				views: 10,
			},
			{ id: 'second', label: 'Second source', views: 5, isGroup: true },
		];
		useUtmReportRecordsMock.mockReturnValue( {
			...reportStatus,
			rows,
		} as ReturnType< typeof useUtmReportRecords > );

		expectCsvExport( UtmReportPage, 'utm-source-medium', rows, [ 'First source', 2 ] );

		const actionProps = reportCsvActionMock.mock.calls.at( -1 )?.[ 0 ] as ExportActionProps;
		expect( actionProps.columns.map( column => column.getValue( actionProps.rows[ 1 ] ) ) ).toEqual(
			[ 'First source > First post', 10 ]
		);
	} );
} );
