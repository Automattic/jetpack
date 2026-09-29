/**
 * External dependencies
 */
import { focusManager, QueryObserver } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { fetchStatsProxy } from '../../api';
import { statsProxyQuery } from '../../queries/stats-query';
import { StatsResponseShapeError } from '../../utils';
import { queryClient } from '../query-client-provider';

jest.mock( '../../api', () => ( {
	...jest.requireActual( '../../api' ),
	fetchStatsProxy: jest.fn(),
} ) );

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

	const mount = ( options: ConstructorParameters< typeof QueryObserver >[ 1 ] ) =>
		new QueryObserver( queryClient, options ).subscribe( () => undefined );

	beforeEach( () => {
		jest.useFakeTimers( { now: new Date( '2026-09-30T12:00:00Z' ) } );
		jest.mocked( fetchStatsProxy ).mockResolvedValue( {} );
	} );

	afterEach( () => {
		focusManager.setFocused( undefined );
		jest.useRealTimers();
		queryClient.clear();
		jest.mocked( fetchStatsProxy ).mockReset();
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

	it.each( [
		[ 'ended before today', '2026-09-29', 'UTC', '2026-09-30T12:00:00Z', 1 ],
		[
			'is still today in the report timezone',
			'2026-09-29',
			'America/Los_Angeles',
			'2026-09-30T02:00:00Z',
			2,
		],
	] )( 'polls a window that %s accordingly', async ( _label, endDate, timezone, now, calls ) => {
		jest.setSystemTime( new Date( now ) );
		const unsubscribe = mount( statsQuery( endDate, timezone ) );

		await jest.advanceTimersByTimeAsync( 31 * MINUTE );
		expect( fetchStatsProxy ).toHaveBeenCalledTimes( calls );

		unsubscribe();
	} );
} );
