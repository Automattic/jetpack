/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	queryClient,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import AnnualInsightsReportPage from '../../routes/reports/annual-insights/page';
import AuthorsReportPage from '../../routes/reports/authors/page';
import ClicksReportPage from '../../routes/reports/clicks/page';
import CommentsReportPage from '../../routes/reports/comments/page';
import DownloadsReportPage from '../../routes/reports/downloads/page';
import EmailsReportPage from '../../routes/reports/emails/page';
import ReferrersReportPage from '../../routes/reports/referrers/page';
import SearchTermsReportPage from '../../routes/reports/search-terms/page';
import TagsReportPage from '../../routes/reports/tags/page';
import UtmReportPage from '../../routes/reports/utm/page';
import VideosReportPage from '../../routes/reports/videos/page';
import AnnualHighlightsWidget from '../../widgets/annual-highlights/render';
import AuthorsWidget from '../../widgets/authors/render';
import ClicksWidget from '../../widgets/clicks/render';
import EmailsWidget from '../../widgets/emails/render';
import FileDownloadsWidget from '../../widgets/file-downloads/render';
import MostCommentedAuthorsWidget from '../../widgets/most-commented-authors/render';
import MostCommentedPostsWidget from '../../widgets/most-commented-posts/render';
import ReferrersWidget from '../../widgets/referrers/render';
import SearchTermsWidget from '../../widgets/search-terms/render';
import TagsWidget from '../../widgets/tags/render';
import { captureCsvDownloads } from '../../widgets/test-utils';
import UtmInsightsWidget from '../../widgets/utm-insights/render';
import VideoPressWidget from '../../widgets/videopress/render';
import { setMockRouteSearch } from './route-test-utils';
import type { ReactElement, ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock(
	'@wordpress/route',
	() => jest.requireActual( './route-test-utils' ).mockWordPressRoute
);
jest.mock( '@wordpress/admin-ui', () => ( { Breadcrumbs: () => null } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getScriptData: () => undefined,
} ) );
jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );
// Only page chrome is stubbed; the CSV hook, action, and button run for real.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportDrilldownTable: () => null,
	ReportRecordsTable: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<>
			{ actions }
			{ children }
		</>
	),
	ReportPageTabs: () => null,
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Comparison on: the report fetches it, the export must not need it.
const REPORT_PARAMS = {
	from: '2026-03-01',
	to: '2026-03-10',
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
};

const RESPONSES: Record< string, unknown > = {
	'stats/file-downloads': {
		date: '2026-03-10',
		days: {},
		summary: {
			files: Array.from( { length: 12 }, ( _, index ) => ( {
				filename: `file-${ index }.pdf`,
				relative_url: `/file-${ index }.pdf`,
				downloads: ( ( index * 5 ) % 12 ) + 1,
			} ) ),
		},
	},
	'stats/search-terms': {
		date: '2026-03-10',
		days: {},
		summary: {
			search_terms: Array.from( { length: 12 }, ( _, index ) => ( {
				term: `term ${ index }`,
				views: ( ( index * 7 ) % 12 ) + 1,
			} ) ),
			encrypted_search_terms: 6,
		},
	},
	'stats/video-plays': {
		date: '2026-03-10',
		period: 'day',
		summary: {
			plays: Array.from( { length: 12 }, ( _, index ) => ( {
				post_id: index + 1,
				title: `Video ${ index + 1 }`,
				url: `https://example.com/video/${ index + 1 }/`,
				plays: ( ( index * 5 ) % 12 ) + 1,
				impressions: 20,
				watch_time: 1.5,
				retention_rate: 40,
			} ) ),
		},
	},
	'stats/clicks': {
		date: '2026-03-10',
		days: {},
		summary: {
			clicks: [
				{
					name: 'wordpress.org',
					views: 30,
					children: [
						{ name: 'wordpress.org/a', views: 20, url: 'https://wordpress.org/a' },
						{ name: 'wordpress.org/b', views: 10, url: 'https://wordpress.org/b' },
					],
				},
				...Array.from( { length: 11 }, ( _, index ) => ( {
					name: `site-${ index }.com`,
					views: 12 - index,
					url: `https://site-${ index }.com/`,
				} ) ),
			],
		},
	},
	'stats/referrers': {
		date: '2026-03-10',
		days: {},
		summary: {
			groups: Array.from( { length: 12 }, ( _, index ) => ( {
				group: `Group ${ index }`,
				name: `Group ${ index }`,
				total: 40 - index,
				results: [
					{ name: `Source ${ index }`, views: 40 - index, url: `https://s${ index }.com/` },
				],
			} ) ),
		},
	},
	'stats/top-authors': {
		date: '2026-03-10',
		period: 'day',
		summary: {
			authors: Array.from( { length: 12 }, ( _, index ) => ( {
				author_id: index + 1,
				name: `Author ${ index + 1 }`,
				views: 50 - index,
				avatar: null,
				posts: [ { id: 100 + index, title: `Post ${ index }`, url: null, views: 50 - index } ],
			} ) ),
		},
	},
	'stats/insights': {
		years: Array.from( { length: 12 }, ( _, index ) => ( {
			year: String( 2015 + index ),
			total_posts: index + 1,
			total_comments: index * 2,
			avg_comments: 2,
			total_likes: index * 3,
			avg_likes: 3,
			total_words: index * 100,
			avg_words: 100.5,
			total_images: index,
			avg_images: 1,
		} ) ),
	},
	'stats/comments': {
		authors: Array.from( { length: 12 }, ( _, index ) => ( {
			name: `Commenter ${ index }`,
			comments: ( ( index * 5 ) % 12 ) + 1,
			link: `?user_id=${ index + 1 }`,
			gravatar: null,
		} ) ),
		posts: Array.from( { length: 12 }, ( _, index ) => ( {
			id: index + 1,
			name: `Commented post ${ index }`,
			comments: ( ( index * 7 ) % 12 ) + 1,
			link: `https://example.com/post-${ index }/`,
		} ) ),
	},
	'stats/tags': {
		tags: Array.from( { length: 12 }, ( _, index ) => ( {
			tags: [
				{ type: 'tag', name: `tag-${ index }`, link: `https://example.com/tag/${ index }/` },
			],
			views: ( ( index * 5 ) % 12 ) + 1,
		} ) ),
	},
	'stats/utm/': {
		top_utm_values: Object.fromEntries(
			Array.from( { length: 12 }, ( _, index ) => [
				JSON.stringify( [ `source-${ index }`, 'email' ] ),
				( ( index * 5 ) % 12 ) + 1,
			] )
		),
		top_posts: {
			[ JSON.stringify( [ 'source-7', 'email' ] ) ]: [
				{ id: 41, title: 'Landing page', views: 3, href: 'https://example.com/landing/' },
			],
		},
	},
	'stats/emails/summary': {
		posts: Array.from( { length: 12 }, ( _, index ) => ( {
			id: index + 1,
			title: `Issue ${ index }`,
			href: `https://example.com/issue-${ index }/`,
			date: `2026-0${ ( index % 9 ) + 1 }-1${ index % 10 }`,
			opens: 10 + index,
			clicks: index,
			opens_rate: 25,
			clicks_rate: 5,
			unique_opens: 8,
			unique_clicks: index ? 1 : 0,
			total_sends: 40,
		} ) ),
	},
};

describe( 'Widget and report CSV parity', () => {
	let downloads: ReturnType< typeof captureCsvDownloads >;

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		setMockRouteSearch( REPORT_PARAMS );
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				Object.entries( RESPONSES ).find( ( [ endpoint ] ) =>
					path.includes( endpoint )
				)?.[ 1 ] ?? {
					date: '2026-03-10',
					days: {},
					summary: {},
				}
			)
		);
		downloads = captureCsvDownloads();
	} );

	afterEach( () => {
		jest.useRealTimers();
		downloads.restore();
	} );

	/**
	 * Render a page or widget, click its Download CSV action, and capture the saved file.
	 *
	 * @param ui - The page or widget to render.
	 * @return The saved file's name and contents.
	 */
	async function download( ui: ReactElement ) {
		const view = render(
			<AnalyticsQueryClientProvider>
				<GlobalErrorProvider>{ ui }</GlobalErrorProvider>
			</AnalyticsQueryClientProvider>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( await screen.findByRole( 'button', { name: /Download CSV/ } ) );
		await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

		const [ saved ] = downloads.files.splice( 0 );
		const file = { filename: saved.filename, csv: await saved.blob.text() };
		view.unmount();

		return file;
	}

	it.each( [
		[ 'File downloads', DownloadsReportPage, FileDownloadsWidget ],
		[ 'Search terms', SearchTermsReportPage, SearchTermsWidget ],
		[ 'Videos', VideosReportPage, VideoPressWidget ],
		[ 'Clicks', ClicksReportPage, ClicksWidget ],
		[ 'Referrers', ReferrersReportPage, ReferrersWidget ],
		[ 'Authors', AuthorsReportPage, AuthorsWidget ],
	] as const )(
		'downloads the same %s file from the widget as from the report page',
		async ( _name, ReportPage, Widget ) => {
			const reportFile = await download( <ReportPage /> );
			queryClient.clear();
			const widgetFile = await download(
				<Widget attributes={ { reportParams: REPORT_PARAMS } } />
			);

			expect( widgetFile ).toEqual( reportFile );
			expect( widgetFile.csv.replace( '﻿', '' ).split( '\n' ).length ).toBeGreaterThan( 11 );
		}
	);

	it.each( [
		[ 'Annual insights', AnnualInsightsReportPage, AnnualHighlightsWidget, undefined ],
		[ 'Comments authors', CommentsReportPage, MostCommentedAuthorsWidget, 'authors' ],
		[ 'Comments posts', CommentsReportPage, MostCommentedPostsWidget, 'posts' ],
		[ 'Tags', TagsReportPage, TagsWidget, undefined ],
		[ 'Emails', EmailsReportPage, EmailsWidget, undefined ],
	] as const )(
		'downloads the same all-time %s file from the widget as from the report page',
		async ( _name, ReportPage, Widget, section ) => {
			setMockRouteSearch( section ? { ...REPORT_PARAMS, section } : REPORT_PARAMS );
			const reportFile = await download( <ReportPage /> );
			queryClient.clear();
			const widgetFile = await download(
				<Widget attributes={ { reportParams: REPORT_PARAMS } } />
			);

			expect( widgetFile ).toEqual( reportFile );
			expect( widgetFile.filename ).not.toMatch( /\d{4}-\d{2}-\d{2}/ );
			expect( widgetFile.csv.replace( '\ufeff', '' ).split( '\n' ).length ).toBeGreaterThan( 11 );
		}
	);

	it.each( [
		[ 'source-medium', 'utm_source,utm_medium' ],
		[ 'campaign-source-medium', 'utm_campaign,utm_source,utm_medium' ],
		[ 'source', 'utm_source' ],
		[ 'medium', 'utm_medium' ],
		[ 'campaign', 'utm_campaign' ],
	] as const )(
		'downloads the same UTM %s file from the widget as from the report page',
		async ( section, utmDimension ) => {
			setMockRouteSearch( { ...REPORT_PARAMS, section } );
			const reportFile = await download( <UtmReportPage /> );
			queryClient.clear();
			const widgetFile = await download(
				<UtmInsightsWidget attributes={ { reportParams: REPORT_PARAMS, utmDimension } } />
			);

			expect( widgetFile ).toEqual( reportFile );
			expect( widgetFile.filename ).toContain( `utm-${ section }-` );
			// 12 values and one post: more than the widget's 10 rows.
			expect( widgetFile.csv.replace( '\ufeff', '' ).split( '\n' ) ).toHaveLength( 14 );
		}
	);

	it( 'downloads the whole UTM report from a widget drilled into one value', async () => {
		setMockRouteSearch( { ...REPORT_PARAMS, section: 'source-medium' } );
		const reportFile = await download( <UtmReportPage /> );
		queryClient.clear();

		const view = render(
			<AnalyticsQueryClientProvider>
				<GlobalErrorProvider>
					<UtmInsightsWidget attributes={ { reportParams: REPORT_PARAMS } } />
				</GlobalErrorProvider>
			</AnalyticsQueryClientProvider>
		);
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click(
			await screen.findByRole( 'button', { name: 'View posts for source-7 / email' } )
		);
		await expect( screen.findByText( 'All UTM insights' ) ).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );
		await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

		const [ saved ] = downloads.files.splice( 0 );
		view.unmount();
		expect( { filename: saved.filename, csv: await saved.blob.text() } ).toEqual( reportFile );
	} );
} );
