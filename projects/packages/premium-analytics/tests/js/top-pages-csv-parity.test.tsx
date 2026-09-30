/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { AnalyticsQueryClientProvider, queryClient } from '@jetpack-premium-analytics/data';
import { useSectionTab } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import PostsReportPage from '../../routes/reports/posts/page';
import TopPostsWidget from '../../widgets/top-posts/render';
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
	useSectionTab: jest.fn(),
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
const mockUseSectionTab = jest.mocked( useSectionTab );

// Comparison on, as on the dashboard by default: the report fetches it, the export must not need it.
const REPORT_PARAMS = {
	from: '2026-03-01',
	to: '2026-03-10',
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
};

const TOP_POSTS_RESPONSE = {
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
};

const ARCHIVES_RESPONSE = {
	date: '2026-03-10',
	period: 'day',
	summary: {
		tag: [
			{ href: 'https://example.com/tag/video/', value: 'video', views: 80 },
			{ href: 'https://example.com/tag/news/', value: 'news', views: 20 },
		],
		cat: [ { href: 'https://example.com/category/updates/', value: 'updates', views: 201 } ],
		tax: { topics: [ { href: 'https://example.com/topics/wp/', value: 'wp', views: 5 } ] },
	},
};

describe( 'Top pages CSV parity', () => {
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
			Promise.resolve( path.includes( 'stats/archives' ) ? ARCHIVES_RESPONSE : TOP_POSTS_RESPONSE )
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
		const view = render( <AnalyticsQueryClientProvider>{ ui }</AnalyticsQueryClientProvider> );

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
		[ 'posts-pages', 'posts' ],
		[ 'archives', 'archives' ],
	] as const )(
		'downloads the same %s file from the widget as from the report page',
		async ( tab, contentView ) => {
			mockUseSectionTab.mockReturnValue( [ tab, jest.fn() ] );

			const reportFile = await download( <PostsReportPage /> );
			queryClient.clear();
			const widgetFile = await download(
				<TopPostsWidget attributes={ { contentView, reportParams: REPORT_PARAMS } } />
			);

			expect( widgetFile ).toEqual( reportFile );
		}
	);

	it( 'downloads every post, not only the rows the widget shows', async () => {
		const { csv } = await download(
			<TopPostsWidget attributes={ { reportParams: REPORT_PARAMS } } />
		);

		expect( csv.replace( '﻿', '' ).split( '\n' ) ).toHaveLength( 13 );
	} );

	it( 'reuses the report page cached rows for the widget download', async () => {
		mockUseSectionTab.mockReturnValue( [ 'posts-pages', jest.fn() ] );
		await download( <PostsReportPage /> );

		render(
			<AnalyticsQueryClientProvider>
				<TopPostsWidget attributes={ { reportParams: REPORT_PARAMS } } />
			</AnalyticsQueryClientProvider>
		);
		const button = await screen.findByRole( 'button', { name: /Download CSV/ } );
		const callsBeforeClick = mockApiFetch.mock.calls.length;

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );
		await waitFor( () => expect( blobs ).toHaveLength( 1 ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( callsBeforeClick );
	} );
} );
