/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import usePostTrafficActivity from '../use-post-traffic-activity';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// Daily history with a gap on 2026-07-02 (the endpoint omits zero-view days).
const STATS_POST_RESPONSE = {
	data: [
		[ '2026-07-01', 2 ],
		[ '2026-07-03', 5 ],
	],
};

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

const reportParams = ( params: Record< string, string > ) => params as unknown as ReportParams;

describe( 'usePostTrafficActivity', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );
	} );

	it( 'zero-fills every calendar day of the window', async () => {
		const { result } = renderHook(
			() =>
				usePostTrafficActivity(
					779,
					reportParams( {
						from: '2026-07-01T00:00:00.000+08:00',
						to: '2026-07-04T23:59:59.999+08:00',
					} )
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.days ).toEqual( [
			{ dateString: '2026-07-01', value: 2 },
			{ dateString: '2026-07-02', value: 0 },
			{ dateString: '2026-07-03', value: 5 },
			{ dateString: '2026-07-04', value: 0 },
		] );
	} );

	it( 'returns no days when a window bound is missing or malformed', async () => {
		const { result } = renderHook(
			() =>
				usePostTrafficActivity(
					779,
					reportParams( { from: 'not-a-date', to: '2026-07-04T23:59:59.999+08:00' } )
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.days ).toEqual( [] );
	} );

	it( 'never fires a request without a post scope', () => {
		const { result } = renderHook( () => usePostTrafficActivity( 0, reportParams( {} ) ), {
			wrapper,
		} );

		expect( result.current.hasData ).toBe( false );
		expect( result.current.days ).toEqual( [] );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
