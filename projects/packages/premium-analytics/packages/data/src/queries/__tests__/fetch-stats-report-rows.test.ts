/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { queryClient } from '../../providers/query-client-provider';
import { fetchStatsArchivesRows, fetchStatsTopPostsRows } from '../fetch-stats-report-rows';
import type { StatsReportParams } from '../stats-query';

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

	it( 'ranks rows by views as the report does', async () => {
		const rows = await fetchStatsTopPostsRows( PARAMS );

		expect( rows.map( row => row.label ) ).toEqual( [ 'Hello World Post', 'About Page' ] );
	} );

	it( 'reuses a fresh cached report instead of refetching', async () => {
		await fetchStatsTopPostsRows( PARAMS );
		await fetchStatsTopPostsRows( PARAMS );

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
