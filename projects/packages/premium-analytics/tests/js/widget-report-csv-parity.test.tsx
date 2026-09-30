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
import AuthorsReportPage from '../../routes/reports/authors/page';
import ClicksReportPage from '../../routes/reports/clicks/page';
import DownloadsReportPage from '../../routes/reports/downloads/page';
import ReferrersReportPage from '../../routes/reports/referrers/page';
import SearchTermsReportPage from '../../routes/reports/search-terms/page';
import VideosReportPage from '../../routes/reports/videos/page';
import AuthorsWidget from '../../widgets/authors/render';
import ClicksWidget from '../../widgets/clicks/render';
import FileDownloadsWidget from '../../widgets/file-downloads/render';
import ReferrersWidget from '../../widgets/referrers/render';
import SearchTermsWidget from '../../widgets/search-terms/render';
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
};

describe( 'Widget and report CSV parity', () => {
	let blobs: Blob[];
	let clickSpy: jest.SpyInstance;
	let originalCreateObjectURL: typeof window.URL.createObjectURL;
	let originalRevokeObjectURL: typeof window.URL.revokeObjectURL;

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
		blobs = [];
		originalCreateObjectURL = window.URL.createObjectURL;
		originalRevokeObjectURL = window.URL.revokeObjectURL;
		// jsdom defines neither, so `jest.spyOn` has nothing to wrap.
		const createObjectURL = jest.fn( ( blob: Blob ) => {
			blobs.push( blob );
			return 'blob:mock';
		} );
		const revokeObjectURL = jest.fn();
		window.URL.createObjectURL = createObjectURL;
		window.URL.revokeObjectURL = revokeObjectURL;
		clickSpy = jest.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.useRealTimers();
		clickSpy.mockRestore();
		window.URL.createObjectURL = originalCreateObjectURL;
		window.URL.revokeObjectURL = originalRevokeObjectURL;
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
		await waitFor( () => expect( blobs ).toHaveLength( 1 ) );

		const file = {
			filename: ( clickSpy.mock.contexts[ 0 ] as HTMLAnchorElement ).download,
			csv: await blobs[ 0 ].text(),
		};
		view.unmount();
		blobs = [];
		clickSpy.mockClear();

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
} );
