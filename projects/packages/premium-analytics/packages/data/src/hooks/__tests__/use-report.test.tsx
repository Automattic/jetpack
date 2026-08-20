/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, type UseQueryOptions } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

	it( 'awaits data when only the comparison window moves, leaving primary untouched', async () => {
		// Deliberate: `isLoading` is the union of both queries, so moving the
		// comparison window alone (previous period → previous year, or switching
		// comparison on) takes the whole widget to a skeleton even though the
		// primary numbers never went stale. The deltas on screen did, and a widget
		// showing one comparison's deltas under another's label is the bug this
		// flag exists to prevent.
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

		// The primary query key never changed, so its own numbers are still on
		// screen — `hasData` proves the old `&& ! hasData` guard would have
		// cancelled this skeleton.
		expect( result.current.hasData ).toBe( true );
		expect( result.current.isLoading ).toBe( true );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
	} );
} );
