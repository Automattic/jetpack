import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import { createElement, type ReactNode } from 'react';
import { useRefreshActivityOnBackupComplete } from '../use-refresh-activity-on-backup-complete';
import type { BackupsState } from '../../types/backup';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

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

type Pair = [ BackupsState, boolean, ( string | null )? ];
type Step = BackupsState | Pair;
const toPair = ( step: Step ): Pair => ( typeof step === 'string' ? [ step, false ] : step );

/**
 * Drive the hook through a sequence of states and report every
 * invalidation it asked for.
 *
 * @param steps - States to render, in order; a `[ state, isRequested, latestBackupId ]` tuple sets the rest.
 * @return The spy on `invalidateQueries` and the hook's last finished-run count.
 */
function walk( steps: Step[] ) {
	const { client, wrapper } = makeWrapper();
	const invalidate = jest.spyOn( client, 'invalidateQueries' );
	const [ first, ...rest ] = steps.map( toPair );
	const { rerender, result } = renderHook(
		( [ state, isRequested, latestBackupId = null ]: Pair ) =>
			useRefreshActivityOnBackupComplete( state, isRequested, latestBackupId ),
		{ wrapper, initialProps: first }
	);
	rest.forEach( pair => rerender( pair ) );
	return { invalidate, result };
}

const ACTIVITY_LOG_ROOT = { queryKey: [ 'backup', 'activity-log' ] };

beforeEach( () => {
	( speak as jest.Mock ).mockClear();
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
		expect( result.current ).toBe( 2 );
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
			'stays quiet about a failed run, even across an unreadable poll',
			[ [ 'in-progress', false, 'a' ], 'error', [ 'complete', false, 'a' ] ],
			0,
		],
	] as Array< [ string, Step[], number ] > )( '%s', ( _name, steps, calls ) => {
		walk( steps );
		expect( speak ).toHaveBeenCalledTimes( calls );
	} );
} );
