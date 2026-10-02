/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useStatsVideoPlays } from '../use-stats-video-plays';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// The default fetcher serves the parked comparison query, as the dashboard's own client does.
const queryClient = new QueryClient( {
	defaultOptions: { queries: { retry: false, queryFn: async () => null } },
} );

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

const plays = [
	{
		post_id: 101,
		title: 'Walkthrough',
		url: 'https://example.com/video/101/',
		plays: 100,
		impressions: 200,
		watch_time: 1000,
		retention_rate: 60,
	},
];

const RESPONSE = {
	date: '2026-03-10',
	period: 'day',
	summary: { plays },
	days: { '2026-03-10': { plays } },
};

const RANGE = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as const;

const countQueries = ( name: string ) =>
	queryClient.getQueryCache().findAll( { queryKey: [ 'stats', name, '1.1' ] } ).length;

describe( 'useStatsVideoPlays', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( RESPONSE );
	} );

	it( 'reads the report window through the video plays query', async () => {
		const { result } = renderHook( () => useStatsVideoPlays( RANGE, { maxRows: 10 } ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.comparisonRows?.rows ).toHaveLength( 1 ) );

		expect( countQueries( 'video-plays' ) ).toBe( 1 );
		expect( countQueries( 'video-plays-summary' ) ).toBe( 0 );
		expect( result.current.comparisonRows?.rows[ 0 ] ).toMatchObject( {
			id: 101,
			label: 'Walkthrough',
			plays: 100,
		} );
	} );

	it( 'switches to the exact-range summary query for summarized complete stats', async () => {
		renderHook( () => useStatsVideoPlays( { ...RANGE, complete_stats: 1, summarize: 1 } ), {
			wrapper,
		} );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );

		expect( countQueries( 'video-plays-summary' ) ).toBe( 1 );
		expect( countQueries( 'video-plays' ) ).toBe( 0 );
	} );
} );
