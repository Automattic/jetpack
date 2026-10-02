/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, type UseQueryOptions } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReport } from '../use-report';
import type { ReportParams } from '../../utils/search';
import type { ReactNode } from 'react';

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'useReport', () => {
	it( 'keeps endpoint-specific params and overrides only comparison dates', () => {
		const calls: Array< { params: ReportParams; queryType: string } > = [];
		const queryFactory = (
			params: ReportParams,
			queryType: string
		): UseQueryOptions< { summary: Record< string, unknown >; data: unknown[] } > => {
			calls.push( { params, queryType } );

			return {
				queryKey: [ 'test-report', queryType, params.from, params.to, params.period ],
				queryFn: async () => ( { summary: {}, data: [] } ),
				enabled: false,
			};
		};

		renderHook(
			() =>
				useReport(
					queryFactory,
					{
						from: '2026-06-01',
						to: '2026-06-07',
						compare_from: '2026-05-01',
						compare_to: '2026-05-07',
						compare_preset: 'previous-period',
						comp: '1',
						interval: 'day',
						period: 'day',
						section: 'stats',
					},
					{
						enabled: false,
					}
				),
			{ wrapper }
		);

		expect( calls ).toEqual( [
			{
				queryType: 'primary',
				params: expect.objectContaining( {
					from: '2026-06-01',
					to: '2026-06-07',
					interval: 'day',
					period: 'day',
					section: 'stats',
				} ),
			},
			{
				queryType: 'comparison',
				params: expect.objectContaining( {
					from: '2026-05-01',
					to: '2026-05-07',
					interval: 'day',
					period: 'day',
					section: 'stats',
				} ),
			},
		] );
		expect( calls[ 0 ].params ).not.toHaveProperty( 'compare_from' );
		expect( calls[ 1 ].params ).not.toHaveProperty( 'compare_from' );
	} );

	it( 'records the reporting zone the params named', () => {
		const queryFactory = (): UseQueryOptions< unknown > => ( {
			queryKey: [ 'test-report' ],
			queryFn: async () => ( { summary: {}, data: [] } ),
			enabled: false,
		} );

		const { result } = renderHook(
			() =>
				useReport(
					queryFactory,
					{
						from: '2026-06-01',
						to: '2026-06-07',
						compare_from: '2026-05-01',
						compare_to: '2026-05-07',
						comp: '1',
						interval: 'day',
						timezone: 'Asia/Kolkata',
					},
					{ enabled: false }
				),
			{ wrapper }
		);

		expect( result.current.timezone ).toBe( 'Asia/Kolkata' );
	} );

	it( 'awaits data when only the comparison window moves, leaving primary untouched', async () => {
		// Deliberate: the whole widget skeletons even though the primary numbers
		// never went stale, because the deltas on screen did — showing one
		// comparison's deltas under another's label is the bug this prevents.
		const queryFactory = (
			params: ReportParams,
			queryType: string
		): UseQueryOptions< { summary: Record< string, unknown > } > => ( {
			queryKey: [ 'test-report', queryType, params.from, params.to ],
			queryFn: async () => ( { summary: { views: 1 } } ),
			placeholderData: ( previousData?: { summary: Record< string, unknown > } ) => previousData,
		} );

		const params = ( compareFrom: string, compareTo: string ): ReportParams => ( {
			from: '2026-06-01',
			to: '2026-06-07',
			compare_from: compareFrom,
			compare_to: compareTo,
			compare_preset: 'previous-period',
			comp: '1',
			interval: 'day',
			period: 'day',
			section: 'stats',
		} );

		const { result, rerender } = renderHook(
			( { compare }: { compare: [ string, string ] } ) =>
				useReport( queryFactory, params( ...compare ) ),
			{ wrapper, initialProps: { compare: [ '2026-05-01', '2026-05-07' ] as [ string, string ] } }
		);

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.hasData ).toBe( true );

		rerender( { compare: [ '2025-06-01', '2025-06-07' ] } );

		// `hasData` proves the old `&& ! hasData` guard would have cancelled this
		// skeleton.
		expect( result.current.hasData ).toBe( true );
		expect( result.current.isLoading ).toBe( true );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
	} );

	// The stuck-skeleton bug (WOOA7S-1902): the Traffic chart switches a request
	// off and moves its `period` in the same change, so it is left on placeholder
	// rows a disabled query never fetches to replace.
	it( 'stops awaiting once a query is switched off mid-flight', async () => {
		type Report = { summary: Record< string, unknown >; data: unknown[] };
		const queryFactory = ( p: ReportParams, queryType: string ): UseQueryOptions< Report > => ( {
			queryKey: [ 'switchable', queryType, p.period ],
			queryFn: async () => ( { summary: { views: 1 }, data: [ { date_start: p.from } ] } ),
			placeholderData: ( previousData?: Report ) => previousData,
		} );

		// Carries comparison params so both queries have a real `queryFn` — the
		// disabled-comparison stub has none, and React Query logs about that.
		const params = ( period: string ): ReportParams =>
			( {
				from: '2026-06-01',
				to: '2026-06-07',
				compare_from: '2026-05-01',
				compare_to: '2026-05-07',
				compare_preset: 'previous-period',
				comp: '1',
				interval: 'day',
				period,
				section: 'stats',
			} ) as ReportParams;

		const { result, rerender } = renderHook(
			( { period, enabled }: { period: string; enabled: boolean } ) =>
				useReport( queryFactory, params( period ), { enabled } ),
			{ wrapper, initialProps: { period: 'day', enabled: true } }
		);

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		// Both at once, as the widget does it.
		rerender( { period: 'hour', enabled: false } );

		expect( result.current.isFetching ).toBe( false );
		expect( result.current.isLoading ).toBe( false );
	} );

	// React Query's own `refetch()` deliberately ignores `enabled`, so the
	// combined refetch applies the gate itself.
	it( 'leaves a switched-off query alone when the combined refetch runs', async () => {
		const fetches: string[] = [];
		const queryFactory = (
			p: ReportParams,
			queryType: string
		): UseQueryOptions< { summary: Record< string, unknown > } > => ( {
			queryKey: [ 'refetch-gate', queryType, p.from, p.to ],
			queryFn: async () => {
				fetches.push( queryType );
				return { summary: { views: 1 } };
			},
		} );

		const params: ReportParams = {
			from: '2026-06-01',
			to: '2026-06-07',
			compare_from: '2026-05-01',
			compare_to: '2026-05-07',
			compare_preset: 'previous-period',
			comp: '1',
			interval: 'day',
			period: 'day',
			section: 'stats',
		};

		const { result, rerender } = renderHook(
			( { enabled }: { enabled: boolean } ) => useReport( queryFactory, params, { enabled } ),
			{ wrapper, initialProps: { enabled: true } }
		);

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( fetches ).toEqual( [ 'primary', 'comparison' ] );

		await act( async () => {
			await result.current.refetch();
		} );
		expect( fetches ).toEqual( [ 'primary', 'comparison', 'primary', 'comparison' ] );

		rerender( { enabled: false } );

		await act( async () => {
			await result.current.refetch();
		} );
		expect( fetches ).toEqual( [ 'primary', 'comparison', 'primary', 'comparison' ] );
	} );
} );
