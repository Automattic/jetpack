/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import usePostHighlights from '../use-post-highlights';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// Daily history: 2 + 3 + 5 + 7 views across four days, plus lifetime totals.
const STATS_POST_RESPONSE = {
	data: [
		[ '2026-07-01', 2 ],
		[ '2026-07-02', 3 ],
		[ '2026-07-03', 5 ],
		[ '2026-07-04', 7 ],
	],
	like_count: 24,
	post: { comment_count: '8' },
};

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

const reportParams = ( params: Record< string, string > ) => params as unknown as ReportParams;

describe( 'usePostHighlights', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );
	} );

	it( 'sums views inside the primary window and reports lifetime comments/likes', async () => {
		const { result } = renderHook(
			() =>
				usePostHighlights(
					779,
					reportParams( {
						from: '2026-07-02T00:00:00.000+08:00',
						to: '2026-07-03T23:59:59.999+08:00',
					} )
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.views ).toBe( 8 );
		expect( result.current.viewsPrevious ).toBeUndefined();
		expect( result.current.hasComparison ).toBe( false );
		expect( result.current.comments ).toBe( 8 );
		expect( result.current.likes ).toBe( 24 );
	} );

	it( 'sums the comparison window when comparison is on with valid bounds', async () => {
		const { result } = renderHook(
			() =>
				usePostHighlights(
					779,
					reportParams( {
						from: '2026-07-03T00:00:00.000+08:00',
						to: '2026-07-04T23:59:59.999+08:00',
						comp: '1',
						compare_from: '2026-07-01T00:00:00.000+08:00',
						compare_to: '2026-07-02T23:59:59.999+08:00',
					} )
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.views ).toBe( 12 );
		expect( result.current.viewsPrevious ).toBe( 5 );
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'reports a null comparison when comparison is on but a bound is missing or malformed', async () => {
		const { result } = renderHook(
			() =>
				usePostHighlights(
					779,
					reportParams( {
						from: '2026-07-03T00:00:00.000+08:00',
						to: '2026-07-04T23:59:59.999+08:00',
						comp: '1',
						compare_from: 'not-a-date',
						compare_to: '2026-07-02T23:59:59.999+08:00',
					} )
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.hasComparison ).toBe( true );
		expect( result.current.viewsPrevious ).toBeNull();
	} );

	it( 'treats comparison as off when compare bounds are present without comp', async () => {
		const { result } = renderHook(
			() =>
				usePostHighlights(
					779,
					reportParams( {
						from: '2026-07-03T00:00:00.000+08:00',
						to: '2026-07-04T23:59:59.999+08:00',
						compare_from: '2026-07-01T00:00:00.000+08:00',
						compare_to: '2026-07-02T23:59:59.999+08:00',
					} )
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.hasComparison ).toBe( false );
		expect( result.current.viewsPrevious ).toBeUndefined();
	} );

	it( 'falls back to the all-time sum when the primary window is missing', async () => {
		const { result } = renderHook( () => usePostHighlights( 779, reportParams( {} ) ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.views ).toBe( 17 );
	} );

	it( 'never fires a request without a post scope', async () => {
		const { result } = renderHook( () => usePostHighlights( 0, reportParams( {} ) ), {
			wrapper,
		} );

		expect( result.current.hasData ).toBe( false );
		expect( result.current.views ).toBe( 0 );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
