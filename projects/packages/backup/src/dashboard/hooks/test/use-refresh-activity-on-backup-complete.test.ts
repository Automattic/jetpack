import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { announce } from '../../data/announce';
import { useRefreshActivityOnBackupComplete } from '../use-refresh-activity-on-backup-complete';
import type { Backup, BackupsState } from '../../types/backup';

jest.mock( '../../data/announce', () => ( {
	...jest.requireActual( '../../data/announce' ),
	announce: jest.fn(),
} ) );

/**
 * Fresh client per test so the module singleton's cache can't leak.
 *
 * @return The client and a wrapper providing it.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

type Pair = [ BackupsState, boolean, ( string | null )?, ( Backup | null )? ];
type Step = BackupsState | Pair;
const toPair = ( step: Step ): Pair => ( typeof step === 'string' ? [ step, false ] : step );

/**
 * Drive the hook through a sequence of states and report every
 * invalidation it asked for.
 *
 * @param steps - States to render, in order; a `[ state, isRequested, latestBackupId, newest ]` tuple sets the rest.
 * @return The spy on `invalidateQueries` and the hook's last result.
 */
function walk( steps: Step[] ) {
	const { client, wrapper } = makeWrapper();
	const invalidate = jest.spyOn( client, 'invalidateQueries' );
	const [ first, ...rest ] = steps.map( toPair );
	const { rerender, result } = renderHook(
		( [ state, isRequested, latestBackupId = null, newest = null ]: Pair ) =>
			useRefreshActivityOnBackupComplete( state, isRequested, latestBackupId, newest ),
		{ wrapper, initialProps: first }
	);
	rest.forEach( pair => rerender( pair ) );
	return { invalidate, result };
}

/**
 * One backup attempt, as `useBackups` normalizes it.
 *
 * @param id          - Attempt id.
 * @param status      - WPCOM status.
 * @param hasWarnings - Whether it finished with some files missing.
 * @return The attempt.
 */
function attempt( id: string, status: string, hasWarnings = false ): Backup {
	const finished = status === 'finished';
	return {
		id,
		status,
		percent: 0,
		isBackup: true,
		isDiscarded: false,
		hasStats: finished,
		hasWarnings,
	};
}

const ACTIVITY_LOG_ROOT = { queryKey: [ 'backup', 'activity-log' ] };

beforeEach( () => {
	( announce as jest.Mock ).mockClear();
} );

describe( 'useRefreshActivityOnBackupComplete', () => {
	it( 'refreshes the activity log when a running backup completes', () => {
		const { invalidate } = walk( [ 'loading', 'in-progress', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 1 );
		expect( invalidate ).toHaveBeenCalledWith( ACTIVITY_LOG_ROOT );
	} );

	it( 'stays quiet on a screen where no backup was ever running', () => {
		const { invalidate } = walk( [ 'loading', 'complete', 'complete' ] );

		expect( invalidate ).not.toHaveBeenCalled();
	} );

	// A `useBackups` failure mode — a WPCOM reply the route could not
	// decode, served as HTTP 200 with a `null` body — lands here. There is no new
	// restore point to fetch, and `pollInterval()` deliberately stops
	// polling rather than hammering an upstream that just failed.
	it( 'does not refresh when a running backup drops to an error', () => {
		const { invalidate } = walk( [ 'in-progress', 'error' ] );

		expect( invalidate ).not.toHaveBeenCalled();
	} );

	// The positive control for the case above: the run is remembered
	// across the failed poll, so the reader's retry still refreshes the
	// list. A previous-state comparison would have forgotten it.
	it( 'still refreshes when the run is only seen to end after a failed poll', () => {
		const { invalidate } = walk( [ 'in-progress', 'error', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 1 );
		expect( invalidate ).toHaveBeenCalledWith( ACTIVITY_LOG_ROOT );
	} );

	// WPCOM logs a failed attempt as its own activity row, so both
	// no-restore-point outcomes are worth a refresh.
	it.each( [ 'will-retry', 'no-good-backups' ] as BackupsState[] )(
		'refreshes when a running backup ends in %s',
		state => {
			const { invalidate } = walk( [ 'in-progress', state ] );

			expect( invalidate ).toHaveBeenCalledTimes( 1 );
		}
	);

	// Nothing new has run, so the retry that recovers from a failed poll
	// on an idle screen must not refresh the list a second time.
	it( 'does not refresh again when a later poll fails and recovers', () => {
		const { invalidate } = walk( [ 'in-progress', 'complete', 'error', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 1 );
	} );

	// Two finished backups in one session — a reader who clicks "Back up
	// now" twice — must each get their own refresh.
	it( 'arms again for the next run', () => {
		const { invalidate, result } = walk( [ 'in-progress', 'complete', 'in-progress', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 2 );
		expect( result.current.finishedRuns ).toBe( 2 );
	} );

	// A `complete` -> `complete` run never shows `in-progress`, so the pending
	// request is what marks it. The old backup alone, while pending, must not fire.
	it.each( [
		[
			'fires once when the request ends on a new complete',
			[ 'complete', [ 'complete', true ], 'complete' ],
			1,
		],
		[
			'stays quiet while the request is pending on the old complete',
			[ 'complete', [ 'complete', true ] ],
			0,
		],
	] as Array< [ string, Step[], number ] > )( '%s', ( _name, steps, calls ) => {
		expect( walk( steps ).invalidate ).toHaveBeenCalledTimes( calls );
	} );

	// A failed run, or a failed or timed-out request, ends on the backup that was already there.
	it.each( [
		[
			'announces a request that produced a backup without showing in-progress',
			[
				[ 'complete', false, 'a' ],
				[ 'complete', true, 'a' ],
				[ 'complete', false, 'b' ],
			],
			1,
		],
		[
			'stays quiet about a backup already complete on load',
			[ 'loading', [ 'complete', false, 'a' ] ],
			0,
		],
		[
			'stays quiet when a request ends with no new backup',
			[
				[ 'complete', false, 'a' ],
				[ 'complete', true, 'a' ],
				[ 'complete', false, 'a' ],
			],
			0,
		],
		[
			'stays quiet about a run that left no attempt, even across an unreadable poll',
			[ [ 'in-progress', false, 'a' ], 'error', [ 'complete', false, 'a' ] ],
			0,
		],
		[
			'stays quiet when a request ends with an old failed attempt still the newest',
			[
				[ 'complete', false, 'a', attempt( '2', 'error' ) ],
				[ 'complete', true, 'a', attempt( '2', 'error' ) ],
				[ 'complete', false, 'a', attempt( '2', 'error' ) ],
			],
			0,
		],
	] as Array< [ string, Step[], number ] > )( '%s', ( _name, steps, calls ) => {
		walk( steps );
		expect( announce ).toHaveBeenCalledTimes( calls );
	} );

	it.each( [
		[
			'a new backup with files missing',
			[ 'complete', 'b', attempt( '2', 'finished', true ) ],
			'Backup is completed with some files missing. See your backup in the cloud for more details.',
			null,
		],
		[
			'a first backup that will be retried',
			[ 'will-retry', null, attempt( '2', 'error-will-retry' ) ],
			"Your latest backup didn't complete. We'll try again shortly.",
			null,
		],
		[
			'a first backup that failed outright',
			[ 'no-good-backups', null, attempt( '2', 'error' ) ],
			'We are having trouble backing up your site.',
			null,
		],
		[
			'a failed attempt that will be retried, behind an older backup',
			[ 'complete', 'a', attempt( '2', 'error-will-retry' ) ],
			"Your latest backup didn't complete. We'll try again shortly.",
			'will-retry',
		],
		[
			'a failed attempt behind an older backup',
			[ 'complete', 'a', attempt( '2', 'error' ) ],
			"Your latest backup didn't complete. Your earlier backups can still be restored.",
			'failed',
		],
		[
			'a first backup that finished without a restore point',
			[ 'no-good-backups', null, { ...attempt( '2', 'finished' ), hasStats: false } ],
			'We are having trouble backing up your site.',
			null,
		],
	] as Array< [ string, [ BackupsState, string | null, Backup ], string, string | null ] > )(
		'announces %s',
		( _name, [ state, latestBackupId, newest ], message, failedRun ) => {
			const { result } = walk( [
				[ 'complete', false, 'a', attempt( '1', 'finished' ) ],
				[ 'in-progress', false, 'a', attempt( '2', 'started' ) ],
				[ state, false, latestBackupId, newest ],
			] );

			expect( announce ).toHaveBeenCalledTimes( 1 );
			expect( announce ).toHaveBeenCalledWith( message );
			expect( result.current.failedRun ).toBe( failedRun );
		}
	);

	it.each( [
		[
			'drops it once the next run starts',
			[ [ 'in-progress', false, 'a', attempt( '3', 'started' ) ] ],
			null,
		],
		[
			'keeps it when a request fails before making an attempt',
			[
				[ 'complete', true, 'a', attempt( '2', 'error' ) ],
				[ 'complete', false, 'a', attempt( '2', 'error' ) ],
			],
			'failed',
		],
		[
			'drops it when a request makes a backup without showing in-progress',
			[
				[ 'complete', true, 'a', attempt( '2', 'error' ) ],
				[ 'complete', false, 'b', attempt( '3', 'finished' ) ],
			],
			null,
		],
	] as Array< [ string, Pair[], string | null ] > )(
		'after a failed run, %s',
		( _name, steps, failedRun ) => {
			const { result } = walk( [
				[ 'in-progress', false, 'a', attempt( '2', 'started' ) ],
				[ 'complete', false, 'a', attempt( '2', 'error' ) ],
				...steps,
			] );

			expect( result.current.failedRun ).toBe( failedRun );
		}
	);
} );

describe( 'when the activity log lags a finished run', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	/**
	 * Mount mid-run, with the activity log's newest backup row at 'old'.
	 *
	 * @return The invalidation spy and a way to render the next state.
	 */
	function mountMidRun() {
		const { client, wrapper } = makeWrapper();
		const invalidate = jest.spyOn( client, 'invalidateQueries' );
		const { rerender, result } = renderHook(
			( [ state, activityTopId ]: [ BackupsState, string | null ] ) =>
				useRefreshActivityOnBackupComplete(
					state,
					false,
					state === 'complete' ? 'b' : 'a',
					null,
					activityTopId
				),
			{ wrapper, initialProps: [ 'in-progress', 'old' ] as [ BackupsState, string | null ] }
		);
		return { invalidate, rerender, result };
	}

	it( 'asks again until the newest activity row changes', () => {
		const { invalidate, rerender, result } = mountMidRun();
		rerender( [ 'complete', 'old' ] );
		expect( invalidate ).toHaveBeenCalledTimes( 1 );
		expect( result.current.isAwaitingRow ).toBe( true );

		act( () => {
			jest.advanceTimersByTime( 6000 );
		} );
		expect( invalidate.mock.calls.length ).toBeGreaterThan( 1 );

		rerender( [ 'complete', 'new' ] );
		expect( result.current.isAwaitingRow ).toBe( false );
		const settled = invalidate.mock.calls.length;
		act( () => {
			jest.advanceTimersByTime( 30_000 );
		} );
		expect( invalidate ).toHaveBeenCalledTimes( settled );
	} );

	it( 'gives up when the row never appears', () => {
		const { invalidate, rerender, result } = mountMidRun();
		rerender( [ 'complete', 'old' ] );

		act( () => {
			jest.advanceTimersByTime( 60_000 );
		} );
		expect( result.current.isAwaitingRow ).toBe( false );
		const settled = invalidate.mock.calls.length;
		act( () => {
			jest.advanceTimersByTime( 60_000 );
		} );
		expect( invalidate ).toHaveBeenCalledTimes( settled );
	} );

	it( 'lets a slow request finish instead of cancelling it on the next tick', async () => {
		const { client, wrapper } = makeWrapper();
		let calls = 0;
		const observer = new QueryObserver( client, {
			queryKey: [ ...ACTIVITY_LOG_ROOT.queryKey, 'page-1' ],
			// Slower than the retry interval.
			queryFn: () => new Promise( resolve => setTimeout( () => resolve( ++calls ), 4000 ) ),
		} );
		observer.subscribe( () => {} );
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 4000 );
		} );
		expect( observer.getCurrentResult().data ).toBe( 1 );

		const { rerender } = renderHook(
			( state: BackupsState ) =>
				useRefreshActivityOnBackupComplete(
					state,
					false,
					state === 'complete' ? 'b' : 'a',
					null,
					'old'
				),
			{ wrapper, initialProps: 'in-progress' as BackupsState }
		);
		rerender( 'complete' );
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 10_000 );
		} );
		expect( observer.getCurrentResult().data ).toBeGreaterThan( 1 );
		observer.destroy();
	} );

	it( 'does not keep asking after a run that made no backup', () => {
		const { invalidate, rerender } = mountMidRun();
		rerender( [ 'no-good-backups', 'old' ] );

		act( () => {
			jest.advanceTimersByTime( 30_000 );
		} );
		expect( invalidate ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'completedRun', () => {
	const ran: Step[] = [ [ 'complete', false, 'a' ], 'in-progress', [ 'complete', false, 'b' ] ];

	it( 'is set once a run makes a new backup, until it is dismissed', () => {
		const { result } = walk( ran );
		expect( result.current.completedRun ).toBe( true );
		act( () => result.current.dismissCompletedRun() );
		expect( result.current.completedRun ).toBe( false );
	} );

	it( 'is cleared when the next run starts', () => {
		expect( walk( [ ...ran, 'in-progress' ] ).result.current.completedRun ).toBe( false );
	} );

	it( 'is not set by a run that made no backup', () => {
		const failed = attempt( 'x', 'error' );
		const { result } = walk( [
			[ 'complete', false, 'a' ],
			[ 'in-progress', false, 'a' ],
			[ 'complete', false, 'a', failed ],
		] );
		expect( result.current.completedRun ).toBe( false );
	} );
} );
