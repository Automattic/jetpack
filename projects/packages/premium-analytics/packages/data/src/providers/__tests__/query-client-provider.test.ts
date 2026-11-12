/**
 * External dependencies
 */
import { focusManager, QueryObserver } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import * as statsProxyFetch from '../../api/stats-proxy-fetch';
import { statsProxyQuery } from '../../queries/stats-query';
import { StatsResponseShapeError } from '../../utils/api-error';
import { queryClient } from '../query-client-provider';

describe( 'query client response-shape diagnostics', () => {
	it( 'warns with the sanitizer detail for a response contract violation', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation();
		const query = queryClient.getQueryCache().build( queryClient, { queryKey: [ 'shape-test' ] } );

		queryClient
			.getQueryCache()
			.config.onError?.( new StatsResponseShapeError( 'Expected hour-of-day data' ), query );

		expect( warn ).toHaveBeenCalledWith( 'Unexpected Stats response: Expected hour-of-day data' );
		warn.mockRestore();
	} );
} );

describe( 'Stats automatic refresh', () => {
	const MINUTE = 60 * 1000;

	const statsQuery = ( endDate: string, timezone = 'UTC' ) =>
		statsProxyQuery( {
			name: 'poll-window',
			version: '1.1',
			endpoint: 'stats/visits',
			params: { end_date: endDate, timezone },
		} );

	let fetchStatsProxy: jest.SpiedFunction< typeof statsProxyFetch.fetchStatsProxy >;

	const mount = ( options: ConstructorParameters< typeof QueryObserver >[ 1 ] ) =>
		new QueryObserver( queryClient, options ).subscribe( () => undefined );

	beforeEach( () => {
		jest.useFakeTimers( { now: new Date( '2026-09-30T12:00:00Z' ) } );
		fetchStatsProxy = jest.spyOn( statsProxyFetch, 'fetchStatsProxy' ).mockResolvedValue( {} );
	} );

	afterEach( () => {
		focusManager.setFocused( undefined );
		jest.useRealTimers();
		queryClient.clear();
		fetchStatsProxy.mockRestore();
	} );

	it( 'refetches a mounted Stats query every 30 minutes while the tab stays open', async () => {
		const unsubscribe = mount( statsQuery( '2026-09-30' ) );

		await jest.advanceTimersByTimeAsync( 29 * MINUTE );
		expect( fetchStatsProxy ).toHaveBeenCalledTimes( 1 );

		await jest.advanceTimersByTimeAsync( MINUTE );
		expect( fetchStatsProxy ).toHaveBeenCalledTimes( 2 );

		unsubscribe();
	} );

	it( 'does not poll while the tab is in the background', async () => {
		const unsubscribe = mount( statsQuery( '2026-09-30' ) );
		await jest.advanceTimersByTimeAsync( 0 );

		focusManager.setFocused( false );
		await jest.advanceTimersByTimeAsync( 31 * MINUTE );
		expect( fetchStatsProxy ).toHaveBeenCalledTimes( 1 );

		unsubscribe();
	} );

	it( 'leaves queries that are not Stats requests unpolled', async () => {
		const queryFn = jest.fn().mockResolvedValue( 'data' );
		const unsubscribe = mount( { queryKey: [ 'not-stats' ], queryFn } );

		await jest.advanceTimersByTimeAsync( 31 * MINUTE );
		expect( queryFn ).toHaveBeenCalledTimes( 1 );

		unsubscribe();
	} );

	it( 'polls a window that is still today in the report timezone accordingly', async () => {
		jest.setSystemTime( new Date( '2026-09-30T02:00:00Z' ) );
		const unsubscribe = mount( statsQuery( '2026-09-29', 'America/Los_Angeles' ) );

		await jest.advanceTimersByTimeAsync( 31 * MINUTE );
		expect( fetchStatsProxy ).toHaveBeenCalledTimes( 2 );

		unsubscribe();
	} );
} );

describe( 'report retries while a store waits for its analytics tables', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
		queryClient.clear();
	} );

	it( 'keeps the query pending and asks again every 3 seconds instead of backing off', async () => {
		const queryFn = jest.fn().mockRejectedValue( {
			code: 'woocommerce_analytics_tables_not_ready',
			data: { status: 503 },
			status: 503,
		} );
		const observer = new QueryObserver( queryClient, {
			queryKey: [ 'tables-not-ready' ],
			queryFn,
		} );
		const unsubscribe = observer.subscribe( () => undefined );

		await jest.advanceTimersByTimeAsync( 12 * 1000 );

		expect( queryFn ).toHaveBeenCalledTimes( 5 );
		expect( observer.getCurrentResult().status ).toBe( 'pending' );

		unsubscribe();
	} );
} );
