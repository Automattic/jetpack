/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import usePostTrafficActivity from '../use-post-traffic-activity';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// Daily history with a gap on 2026-07-02 (the endpoint omits zero-view days)
// and a day before the selected range (must stay blank in the padded grid).
const STATS_POST_RESPONSE = {
	data: [
		[ '2026-06-30', 9 ],
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

	it( 'pads short ranges to the grid span, blanking filler and no-traffic days', async () => {
		const { result } = renderHook(
			() =>
				usePostTrafficActivity(
					779,
					reportParams( {
						from: '2026-07-01T00:00:00.000+08:00',
						to: '2026-07-04T23:59:59.999+08:00',
					} ),
					168
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		const { days } = result.current;

		// The 4-day range pads backward to the grid span, with the page
		// snapped to week boundaries (Monday 2026-01-19 → Sunday 2026-07-05,
		// 24 columns) — but the emitted days stop at the range end, so the
		// trailing week-completion day (2026-07-05) renders as a ragged
		// edge, not a blank cell.
		expect( days ).toHaveLength( 167 );
		expect( days[ 0 ].dateString ).toBe( '2026-01-19' );

		// Values render only inside the selected range; the in-range gap is blank.
		expect( days.slice( -4 ) ).toEqual( [
			{ dateString: '2026-07-01', value: 2 },
			{ dateString: '2026-07-02', value: null },
			{ dateString: '2026-07-03', value: 5 },
			{ dateString: '2026-07-04', value: null },
		] );

		// Filler days stay blank even where the history has views (2026-06-30).
		expect( days.slice( 0, -4 ).every( day => day.value === null ) ).toBe( true );

		// One page covers the range, so no pager.
		expect( result.current.isPaged ).toBe( false );
	} );

	it( 'pages a long range from the newest page backward', async () => {
		const { result } = renderHook(
			() =>
				usePostTrafficActivity(
					779,
					reportParams( {
						// 185 days — one page (168) plus a partial older page.
						from: '2026-01-01T00:00:00.000+08:00',
						to: '2026-07-04T23:59:59.999+08:00',
					} ),
					168
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		// Newest page first: the page window ends at the end of the range's
		// last week (Sunday 2026-07-05), but the emitted days stop at the
		// range end so the extra day renders as a ragged edge.
		expect( result.current.isPaged ).toBe( true );
		expect( result.current.canShowNewer ).toBe( false );
		expect( result.current.canShowOlder ).toBe( true );
		expect( result.current.days ).toHaveLength( 167 );
		expect( result.current.days.at( -1 )?.dateString ).toBe( '2026-07-04' );

		act( () => result.current.showOlder() );

		// The oldest page clamps to the range's first week (Monday
		// 2025-12-29) and fills forward (overlapping the previous page) — and
		// while paging, days before the range start are omitted too, so the
		// emitted days open at the range start (2026-01-01) and the three
		// leading week-completion days render as a ragged edge.
		expect( result.current.canShowNewer ).toBe( true );
		expect( result.current.canShowOlder ).toBe( false );
		expect( result.current.days ).toHaveLength( 165 );
		expect( result.current.days[ 0 ].dateString ).toBe( '2026-01-01' );
		expect( result.current.days.at( -1 )?.dateString ).toBe( '2026-06-14' );
		expect( result.current.days[ 0 ].value ).toBeNull();
	} );

	it( 'returns no days when a window bound is missing or malformed', async () => {
		const { result } = renderHook(
			() =>
				usePostTrafficActivity(
					779,
					reportParams( { from: 'not-a-date', to: '2026-07-04T23:59:59.999+08:00' } ),
					168
				),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.hasData ).toBe( true ) );

		expect( result.current.days ).toEqual( [] );
	} );

	it( 'never fires a request without a post scope', () => {
		const { result } = renderHook( () => usePostTrafficActivity( 0, reportParams( {} ), 168 ), {
			wrapper,
		} );

		expect( result.current.hasData ).toBe( false );
		expect( result.current.days ).toEqual( [] );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
