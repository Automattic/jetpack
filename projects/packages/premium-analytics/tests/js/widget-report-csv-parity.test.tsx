/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { AnalyticsQueryClientProvider, queryClient } from '@jetpack-premium-analytics/data';
import { useSectionTab } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import AnnualInsightsReportPage from '../../routes/reports/annual-insights/page';
import AuthorsReportPage from '../../routes/reports/authors/page';
import ClicksReportPage from '../../routes/reports/clicks/page';
import CommentsReportPage from '../../routes/reports/comments/page';
import DownloadsReportPage from '../../routes/reports/downloads/page';
import EmailsReportPage from '../../routes/reports/emails/page';
import LocationsReportPage from '../../routes/reports/locations/page';
import PostsReportPage from '../../routes/reports/posts/page';
import ReferrersReportPage from '../../routes/reports/referrers/page';
import SearchTermsReportPage from '../../routes/reports/search-terms/page';
import TagsReportPage from '../../routes/reports/tags/page';
import UtmReportPage from '../../routes/reports/utm/page';
import AnnualHighlightsWidget from '../../widgets/annual-highlights/render';
import AuthorsWidget from '../../widgets/authors/render';
import ClicksWidget from '../../widgets/clicks/render';
import EmailsWidget from '../../widgets/emails/render';
import FileDownloadsWidget from '../../widgets/file-downloads/render';
import LocationsWidget from '../../widgets/locations/render';
import MostCommentedAuthorsWidget from '../../widgets/most-commented-authors/render';
import MostCommentedPostsWidget from '../../widgets/most-commented-posts/render';
import ReferrersWidget from '../../widgets/referrers/render';
import SearchTermsWidget from '../../widgets/search-terms/render';
import TagsWidget from '../../widgets/tags/render';
import { captureCsvDownloads } from '../../widgets/test-utils';
import TopPostsWidget from '../../widgets/top-posts/render';
import UtmInsightsWidget from '../../widgets/utm-insights/render';
import { setMockRouteSearch } from './route-test-utils';

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
	useSectionTab: jest.fn(),
} ) );
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportDrilldownTable: () => null,
	// Google Charts never loads in jsdom.
	LocationsGeoChart: () => null,
	ReportLocationsMap: () => null,
	ReportRecordsTable: MockRecordsTable,
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

/**
 * Pick a country the way the Locations table's filter does; other reports ignore it.
 *
 * @param props              - The records table props.
 * @param props.onChangeView - The page's view change handler.
 * @return A button that picks the United States, or nothing.
 */
function MockRecordsTable( { onChangeView }: { onChangeView?: ( view: object ) => void } ) {
	const pickUnitedStates = useCallback(
		() => onChangeView?.( { filters: [ { field: 'country', operator: 'is', value: 'US' } ] } ),
		[ onChangeView ]
	);

	return onChangeView ? (
		<button type="button" onClick={ pickUnitedStates }>
			Pick United States
		</button>
	) : null;
}
const mockUseSectionTab = jest.mocked( useSectionTab );

// Comparison on: the report fetches it, the export must not need it.
const REPORT_PARAMS = {
	from: '2026-03-01',
	to: '2026-03-10',
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
};

const COUNTRIES = {
	US: 'United States',
	CA: 'Canada',
	GB: 'United Kingdom',
	DE: 'Germany',
	FR: 'France',
	JP: 'Japan',
	AU: 'Australia',
	IN: 'India',
	BR: 'Brazil',
	MX: 'Mexico',
	ES: 'Spain',
	IT: 'Italy',
};

const place = (
	country_code: string,
	location: string | undefined,
	views: number,
	region?: string
) => ( { country_code, location, views, region } );

// Eleven US regions and eleven Minnesota cities: a scoped download still outgrows the widget's 10 rows.
const LOCATION_ROWS: Record< string, ReturnType< typeof place >[] > = {
	country: Object.keys( COUNTRIES ).map( ( code, index ) => place( code, undefined, 40 - index ) ),
	region: [
		place( 'US', 'Minnesota', 30 ),
		...Array.from( { length: 10 }, ( _, index ) =>
			place( 'US', `US region ${ index }`, 29 - index )
		),
		place( 'CA', 'Ontario', 25 ),
	],
	city: [
		...Array.from( { length: 11 }, ( _, index ) =>
			place( 'US', `Minnesota city ${ index }`, 30 - index, 'Minnesota' )
		),
		place( 'US', 'Austin', 26, 'Texas' ),
		place( 'CA', 'Toronto', 25, 'Ontario' ),
	],
};

const RESPONSES: Record< string, unknown | ( ( path: string ) => unknown ) > = {
	// Honors `max` and both filters, as the endpoint does.
	'stats/location-views/': ( path: string ) => {
		const url = new URL( path, 'https://example.com' );
		const country = url.searchParams.get( 'filter_by_country' );
		const region = url.searchParams.get( 'filter_by_region' );
		const max = Number( url.searchParams.get( 'max' ) );
		const views = LOCATION_ROWS[ /location-views\/(\w+)/.exec( path )?.[ 1 ] ?? '' ]
			.filter(
				row =>
					( ! country || row.country_code === country ) && ( ! region || row.region === region )
			)
			.slice( 0, max > 0 ? max : undefined );

		return {
			date: '2026-03-10',
			summary: { views },
			days: { '2026-03-10': { views } },
			'country-info': Object.fromEntries(
				Object.entries( COUNTRIES ).map( ( [ code, name ] ) => [ code, { country_full: name } ] )
			),
		};
	},
	'stats/top-posts': {
		date: '2026-03-10',
		days: {},
		summary: {
			postviews: Array.from( { length: 12 }, ( _, index ) => ( {
				id: index + 1,
				href: `https://example.com/post-${ index + 1 }/`,
				date: '2026-03-01',
				title: `Post ${ index + 1 }`,
				type: 'post',
				views: ( ( index * 7 ) % 12 ) + 1,
			} ) ),
			total_views: 78,
		},
	},
	'stats/archives': {
		date: '2026-03-10',
		period: 'day',
		summary: {
			tag: Array.from( { length: 12 }, ( _, index ) => ( {
				href: `https://example.com/tag/tag-${ index }/`,
				value: `tag-${ index }`,
				views: 80 - index,
			} ) ),
			cat: [ { href: 'https://example.com/category/updates/', value: 'updates', views: 201 } ],
			tax: { topics: [ { href: 'https://example.com/topics/wp/', value: 'wp', views: 5 } ] },
		},
	},
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
	// Honors `max` as the endpoint does, so a download reusing the widget's 10-row query fails.
	'stats/utm/': ( path: string ) => {
		const max = Number( new URL( path, 'https://example.com' ).searchParams.get( 'max' ) );
		const values = Array.from( { length: 12 }, ( _, index ) => [
			JSON.stringify( [ `source-${ index }`, 'email' ] ),
			( ( index * 5 ) % 12 ) + 1,
		] ).sort( ( a, b ) => Number( b[ 1 ] ) - Number( a[ 1 ] ) );

		return {
			top_utm_values: Object.fromEntries( values.slice( 0, max > 0 ? max : undefined ) ),
			top_posts: {
				[ JSON.stringify( [ 'source-7', 'email' ] ) ]: [
					{ id: 41, title: 'Landing page', views: 3, href: 'https://example.com/landing/' },
				],
			},
		};
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

const CASES: {
	name: string;
	Page: ComponentType;
	widget: ( reportParams: Record< string, string > ) => ReactElement;
	tab?: string;
}[] = [
	{
		name: 'Posts & pages',
		Page: PostsReportPage,
		widget: reportParams => <TopPostsWidget attributes={ { reportParams } } />,
		tab: 'posts-pages',
	},
	{
		name: 'Archives',
		Page: PostsReportPage,
		widget: reportParams => (
			<TopPostsWidget attributes={ { contentView: 'archives', reportParams } } />
		),
		tab: 'archives',
	},
	{
		name: 'File downloads',
		Page: DownloadsReportPage,
		widget: reportParams => <FileDownloadsWidget attributes={ { reportParams } } />,
	},
	{
		name: 'Search terms',
		Page: SearchTermsReportPage,
		widget: reportParams => <SearchTermsWidget attributes={ { reportParams } } />,
	},

	{
		name: 'Clicks',
		Page: ClicksReportPage,
		widget: reportParams => <ClicksWidget attributes={ { reportParams } } />,
	},
	{
		name: 'Referrers',
		Page: ReferrersReportPage,
		widget: reportParams => <ReferrersWidget attributes={ { reportParams } } />,
	},
	{
		name: 'Authors',
		Page: AuthorsReportPage,
		widget: reportParams => <AuthorsWidget attributes={ { reportParams } } />,
	},
];

// A 403 is not retried, so the query settles as failed at once.
const FORBIDDEN = { status: 403, code: 'forbidden', message: 'Forbidden' };

/**
 * Answer a Stats request with the fixture for its endpoint.
 *
 * @param path - The requested proxy path.
 * @return The fixture response.
 */
function respond( path: string ) {
	const response = Object.entries( RESPONSES ).find( ( [ endpoint ] ) =>
		path.includes( endpoint )
	)?.[ 1 ];

	return Promise.resolve(
		typeof response === 'function'
			? response( path )
			: ( response ?? { date: '2026-03-10', days: {}, summary: {} } )
	);
}

/**
 * Wrap a page or widget in the providers the dashboard mounts it under.
 *
 * @param ui - The page or widget.
 * @return The wrapped element.
 */
function withProviders( ui: ReactElement ) {
	return <AnalyticsQueryClientProvider>{ ui }</AnalyticsQueryClientProvider>;
}

describe( 'Widget and report CSV parity', () => {
	let downloads: ReturnType< typeof captureCsvDownloads >;

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		setMockRouteSearch( REPORT_PARAMS );
		mockUseSectionTab.mockReturnValue( [ 'posts-pages', jest.fn() ] );
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => respond( path ) );
		downloads = captureCsvDownloads();
	} );

	afterEach( () => {
		jest.useRealTimers();
		downloads.restore();
	} );

	/**
	 * Render a page or widget, click its Download CSV action, and capture the saved file.
	 *
	 * @param ui      - The page or widget to render.
	 * @param prepare - Interaction to run before downloading.
	 * @return The saved file's name and contents.
	 */
	async function download( ui: ReactElement, prepare?: () => Promise< void > ) {
		const view = render( withProviders( ui ) );
		await prepare?.();
		const button = await screen.findByRole( 'button', { name: /Download CSV/ } );

		await downloads.clickAndSave( button );

		const [ saved ] = downloads.files.splice( 0 );
		const file = { filename: saved.filename, csv: await saved.blob.text() };
		view.unmount();

		return file;
	}

	it.each( CASES )(
		'downloads the same $name file from the widget as from the report page',
		async ( { Page, widget, tab } ) => {
			if ( tab ) {
				mockUseSectionTab.mockReturnValue( [ tab, jest.fn() ] );
			}

			const reportFile = await download( <Page /> );
			queryClient.clear();
			const widgetFile = await download( widget( REPORT_PARAMS ) );

			expect( widgetFile ).toEqual( reportFile );
			expect( widgetFile.csv.replace( '\ufeff', '' ).split( '\n' ).length ).toBeGreaterThan( 11 );
		}
	);

	it( 'reuses the report page cached rows for the widget download', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		await download( <PostsReportPage /> );

		render( withProviders( CASES[ 0 ].widget( REPORT_PARAMS ) ) );
		const button = await screen.findByRole( 'button', { name: /Download CSV/ } );
		const callsBeforeClick = mockApiFetch.mock.calls.length;

		await user.click( button );
		await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( callsBeforeClick );
	} );

	it.each( CASES )(
		'keeps the $name download when only the comparison request fails',
		async ( { widget } ) => {
			mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
				path.includes( '2026-02' ) ? Promise.reject( FORBIDDEN ) : respond( path )
			);

			render( withProviders( widget( REPORT_PARAMS ) ) );

			await expect(
				screen.findByRole( 'button', { name: /Download CSV/ } )
			).resolves.toBeInTheDocument();
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( '2026-02' ) } )
			);
		}
	);

	it.each( [
		[ 'annual-insights.csv', AnnualInsightsReportPage, AnnualHighlightsWidget, undefined ],
		[ 'comments-authors.csv', CommentsReportPage, MostCommentedAuthorsWidget, 'authors' ],
		[ 'comments-posts.csv', CommentsReportPage, MostCommentedPostsWidget, 'posts' ],
		[ 'tags-and-categories.csv', TagsReportPage, TagsWidget, undefined ],
		[ 'emails.csv', EmailsReportPage, EmailsWidget, undefined ],
	] as const )(
		'downloads the same all-time %s from the widget as from the report page',
		async ( filename, ReportPage, Widget, section ) => {
			if ( section ) {
				mockUseSectionTab.mockReturnValue( [ section, jest.fn() ] );
			}

			const reportFile = await download( <ReportPage /> );
			queryClient.clear();
			const widgetFile = await download(
				<Widget attributes={ { reportParams: REPORT_PARAMS } } />
			);

			expect( widgetFile ).toEqual( reportFile );
			expect( widgetFile.filename ).toBe( filename );
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
			mockUseSectionTab.mockReturnValue( [ section, jest.fn() ] );
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

	it( 'keeps the UTM download when only the comparison request fails', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.includes( '2026-02' ) ? Promise.reject( FORBIDDEN ) : respond( path )
		);

		render( withProviders( <UtmInsightsWidget attributes={ { reportParams: REPORT_PARAMS } } /> ) );

		await expect(
			screen.findByRole( 'button', { name: /Download CSV/ } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '2026-02' ) } )
		);
	} );

	it( 'downloads the whole UTM report from a widget drilled into one value', async () => {
		mockUseSectionTab.mockReturnValue( [ 'source-medium', jest.fn() ] );
		const reportFile = await download( <UtmReportPage /> );
		queryClient.clear();

		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const view = render(
			withProviders( <UtmInsightsWidget attributes={ { reportParams: REPORT_PARAMS } } /> )
		);
		await user.click(
			await screen.findByRole( 'button', { name: 'View posts for source-7 / email' } )
		);
		await expect( screen.findByText( 'All UTM insights' ) ).resolves.toBeInTheDocument();
		await downloads.clickAndSave( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		const [ saved ] = downloads.files.splice( 0 );
		view.unmount();
		expect( { filename: saved.filename, csv: await saved.blob.text() } ).toEqual( reportFile );
	} );

	/**
	 * Click a control by its accessible name.
	 *
	 * @param name - The control's accessible name.
	 */
	async function click( name: string ) {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		await user.click( await screen.findByRole( 'button', { name } ) );
	}

	it.each( [
		[ 'countries', 'country', 13 ],
		[ 'regions', 'region', 13 ],
		[ 'cities', 'city', 14 ],
	] as const )(
		'downloads the same Locations %s file from the widget as from the report page',
		async ( section, geoGranularity, lines ) => {
			mockUseSectionTab.mockReturnValue( [ section, jest.fn() ] );
			const reportFile = await download( <LocationsReportPage /> );
			queryClient.clear();
			const widgetFile = await download(
				<LocationsWidget attributes={ { reportParams: REPORT_PARAMS, geoGranularity } } />
			);

			expect( widgetFile ).toEqual( reportFile );
			expect( widgetFile.filename ).toContain( `locations-${ section }-` );
			expect( widgetFile.csv.replace( '\ufeff', '' ).split( '\n' ) ).toHaveLength( lines );
		}
	);

	it( 'downloads a country’s regions from the widget as the report filtered to it', async () => {
		mockUseSectionTab.mockReturnValue( [ 'regions', jest.fn() ] );
		const reportFile = await download( <LocationsReportPage />, () =>
			click( 'Pick United States' )
		);
		queryClient.clear();
		const widgetFile = await download(
			<LocationsWidget attributes={ { reportParams: REPORT_PARAMS } } />,
			() => click( 'View regions in United States' )
		);

		expect( widgetFile ).toEqual( reportFile );
		expect( widgetFile.filename ).toContain( 'locations-regions-us-' );
		expect( widgetFile.csv ).not.toContain( 'Ontario' );
		expect( widgetFile.csv.replace( '\ufeff', '' ).split( '\n' ) ).toHaveLength( 12 );
	} );

	it( 'downloads only the cities of the region the widget is drilled into', async () => {
		const widgetFile = await download(
			<LocationsWidget attributes={ { reportParams: REPORT_PARAMS } } />,
			async () => {
				await click( 'View regions in United States' );
				await click( 'View cities in Minnesota' );
			}
		);

		expect( widgetFile.filename ).toBe( 'locations-cities-us-minnesota-2026-03-01_2026-03-10.csv' );
		expect( widgetFile.csv ).toContain( 'Minnesota city 10' );
		expect( widgetFile.csv ).not.toContain( 'Austin' );
		expect( widgetFile.csv.replace( '\ufeff', '' ).split( '\n' ) ).toHaveLength( 12 );
	} );

	it( 'downloads every country again after the widget backs out of a drill-down', async () => {
		mockUseSectionTab.mockReturnValue( [ 'countries', jest.fn() ] );
		const reportFile = await download( <LocationsReportPage /> );
		queryClient.clear();
		const widgetFile = await download(
			<LocationsWidget attributes={ { reportParams: REPORT_PARAMS } } />,
			async () => {
				await click( 'View regions in United States' );
				await click( 'View all locations' );
			}
		);

		expect( widgetFile ).toEqual( reportFile );
	} );

	it( 'keeps the Locations download when only the comparison request fails', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.includes( '2026-02' ) ? Promise.reject( FORBIDDEN ) : respond( path )
		);

		render( withProviders( <LocationsWidget attributes={ { reportParams: REPORT_PARAMS } } /> ) );

		await expect(
			screen.findByRole( 'button', { name: /Download CSV/ } )
		).resolves.toBeInTheDocument();
	} );
} );
