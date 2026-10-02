/**
 * External dependencies
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement } from 'react';
/**
 * Internal dependencies
 */
import { useStatsClicks } from '../../hooks/use-stats-clicks';
import { useStatsFileDownloads } from '../../hooks/use-stats-file-downloads';
import { useStatsReferrers } from '../../hooks/use-stats-referrers';
import { useStatsSearchTerms } from '../../hooks/use-stats-search-terms';
import { useStatsTopAuthors } from '../../hooks/use-stats-top-authors';
import { useStatsVideoPlays } from '../../hooks/use-stats-video-plays';
import { queryClient } from '../../providers/query-client-provider';
import {
	fetchStatsArchivesRows,
	fetchStatsClicksRows,
	fetchStatsFileDownloadsRows,
	fetchStatsReferrersRows,
	fetchStatsSearchTermsReport,
	fetchStatsTopAuthorsRows,
	fetchStatsTopPostsRows,
	fetchStatsVideoPlaysRows,
} from '../fetch-stats-report-rows';
import type { StatsReportParams } from '../stats-query';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const PARAMS = {
	from: '2026-03-01',
	to: '2026-03-10',
	interval: 'day',
	max: 0,
	period: 'day',
	summarize: 1,
	skip_archives: 1,
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
} as StatsReportParams;

const TOP_POSTS_RESPONSE = {
	date: '2026-03-10',
	days: {},
	summary: {
		postviews: [
			{
				id: 2,
				href: 'https://example.com/about/',
				date: null,
				title: 'About Page',
				type: 'page',
				views: 7,
			},
			{
				id: 1,
				href: 'https://example.com/hello-world/',
				date: '2026-03-01',
				title: 'Hello World Post',
				type: 'post',
				views: 42,
			},
		],
		total_views: 49,
	},
};

const ARCHIVES_RESPONSE = {
	date: '2026-03-10',
	period: 'day',
	summary: {
		tag: [ { href: 'https://example.com/tag/video/', value: 'video', views: 80 } ],
		cat: [ { href: 'https://example.com/category/news/', value: 'news', views: 201 } ],
	},
};

describe( 'fetchStatsTopPostsRows', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( TOP_POSTS_RESPONSE );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'fetches the primary report once, without a comparison request', async () => {
		await fetchStatsTopPostsRows( PARAMS );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		const { path } = mockApiFetch.mock.calls[ 0 ][ 0 ];
		expect( path ).toContain( 'stats/top-posts' );
		expect( path ).toContain( 'max=0' );
		expect( path ).not.toContain( '2026-02' );
	} );

	it( 'fails on the first server error instead of retrying', async () => {
		mockApiFetch.mockRejectedValue( { code: 'server_error', data: { status: 500 } } );

		const result = fetchStatsTopPostsRows( PARAMS ).catch( ( error: unknown ) => error );
		await jest.runAllTimersAsync();

		await expect( result ).resolves.toMatchObject( { code: 'server_error' } );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'fetchStatsArchivesRows', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( ARCHIVES_RESPONSE );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'fetches the primary archives report and sorts groups by views', async () => {
		const rows = await fetchStatsArchivesRows( PARAMS );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( 'stats/archives' );
		expect( rows.map( row => row.label ) ).toEqual( [ 'cat', 'tag' ] );
	} );
} );

const RANGE = {
	from: '2026-03-01',
	to: '2026-03-10',
	interval: 'day',
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
} as StatsReportParams;

const FULL = { ...RANGE, max: 0, summarize: 1, period: 'day' } as StatsReportParams;
const AUTHORS = { ...RANGE, max: 0 } as StatsReportParams;
const VIDEO_SUMMARY = { ...RANGE, max: 0, summarize: 1, complete_stats: 1 } as StatsReportParams;

describe( 'report row fetchers', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	function requestedPaths(): string[] {
		return mockApiFetch.mock.calls.map( ( [ { path } ] ) => path );
	}

	it( 'fetches every file download', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-03-10',
			days: {},
			summary: {
				files: [
					{ filename: 'a.pdf', relative_url: '/a.pdf', downloads: 2 },
					{ filename: 'b.pdf', relative_url: '/b.pdf', downloads: 9 },
				],
			},
		} );

		const rows = await fetchStatsFileDownloadsRows( FULL );

		expect( requestedPaths()[ 0 ] ).toContain( 'stats/file-downloads' );
		expect( rows.map( row => row.shortLabel ) ).toEqual( [ 'a.pdf', 'b.pdf' ] );
	} );

	it( 'returns the raw search-terms report for aggregation', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-03-10',
			days: {},
			summary: { search_terms: [ { term: 'jetpack', views: 3 } ], encrypted_search_terms: 4 },
		} );

		const report = await fetchStatsSearchTermsReport( FULL );

		expect( report.summary.encrypted_search_terms ).toBe( 4 );
	} );

	it( 'fetches the complete-stats video summary the Videos report uses', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-03-10',
			period: 'day',
			summary: {
				plays: [ { post_id: 7, title: 'Intro', url: 'https://example.com/v/', plays: 5 } ],
			},
		} );

		const rows = await fetchStatsVideoPlaysRows( { ...VIDEO_SUMMARY, period: 'month' } );

		expect( requestedPaths()[ 0 ] ).toContain( 'period=day' );
		expect( requestedPaths()[ 0 ] ).toContain( 'complete_stats=1' );
		expect( rows.map( row => row.plays ) ).toEqual( [ 5 ] );
	} );

	it( 'fetches clicks, referrers, and authors', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( 'stats/clicks' ) ) {
				return Promise.resolve( {
					date: '2026-03-10',
					days: {},
					summary: { clicks: [ { name: 'jetpack.com', views: 3, url: 'https://jetpack.com/' } ] },
				} );
			}
			if ( path.includes( 'stats/referrers' ) ) {
				return Promise.resolve( {
					date: '2026-03-10',
					days: {},
					summary: {
						groups: [ { group: 'Search', name: 'Search', total: 4, results: [] } ],
					},
				} );
			}
			return Promise.resolve( {
				date: '2026-03-10',
				period: 'day',
				summary: { authors: [ { author_id: 1, name: 'Ana', views: 6, posts: [] } ] },
			} );
		} );

		const [ clicks, referrers, authors ] = await Promise.all( [
			fetchStatsClicksRows( FULL ),
			fetchStatsReferrersRows( FULL ),
			fetchStatsTopAuthorsRows( AUTHORS ),
		] );

		expect( clicks.map( row => row.views ) ).toEqual( [ 3 ] );
		expect( referrers.map( row => row.label ) ).toEqual( [ 'Search' ] );
		expect( authors.map( row => row.label ) ).toEqual( [ 'Ana' ] );
	} );
} );

function wrapper( { children }: { children: ReactNode } ) {
	return createElement( QueryClientProvider, { client: queryClient }, children );
}

const SHARED_QUERY_CASES: [
	string,
	() => Promise< unknown >,
	() => { primary: { isSuccess: boolean } },
][] = [
	[ 'clicks', () => fetchStatsClicksRows( FULL ), () => useStatsClicks( FULL ) ],
	[ 'referrers', () => fetchStatsReferrersRows( FULL ), () => useStatsReferrers( FULL ) ],
	[
		'file downloads',
		() => fetchStatsFileDownloadsRows( FULL ),
		() => useStatsFileDownloads( FULL ),
	],
	[ 'search terms', () => fetchStatsSearchTermsReport( FULL ), () => useStatsSearchTerms( FULL ) ],
	[ 'authors', () => fetchStatsTopAuthorsRows( AUTHORS ), () => useStatsTopAuthors( AUTHORS ) ],
	[
		'videos',
		() => fetchStatsVideoPlaysRows( VIDEO_SUMMARY ),
		() => useStatsVideoPlays( VIDEO_SUMMARY ),
	],
];

describe( 'report row fetchers and the report hooks', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-03-10', period: 'day', days: {}, summary: {} } );
	} );

	it.each( SHARED_QUERY_CASES )(
		'share the %s primary query',
		async ( _name, fetchRows, useReportHook ) => {
			await fetchRows();

			const { result } = renderHook( useReportHook, { wrapper } );

			expect( result.current.primary.isSuccess ).toBe( true );
		}
	);
} );
