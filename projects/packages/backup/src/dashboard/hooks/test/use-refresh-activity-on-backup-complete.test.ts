import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { useRefreshActivityOnBackupComplete } from '../use-refresh-activity-on-backup-complete';
import type { BackupsState } from '../../types/backup';

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

/**
 * Drive the hook through a sequence of states and report every
 * invalidation it asked for.
 *
 * @param states - States to render, in order.
 * @return The spy on `invalidateQueries`.
 */
function walk( states: BackupsState[] ): jest.SpyInstance {
	const { client, wrapper } = makeWrapper();
	const invalidate = jest.spyOn( client, 'invalidateQueries' );
	const [ first, ...rest ] = states;
	const { rerender } = renderHook(
		( state: BackupsState ) => useRefreshActivityOnBackupComplete( state ),
		{ wrapper, initialProps: first }
	);
	rest.forEach( state => rerender( state ) );
	return invalidate;
}

const ACTIVITY_LOG_ROOT = { queryKey: [ 'backup', 'activity-log' ] };

describe( 'useRefreshActivityOnBackupComplete', () => {
	it( 'refreshes the activity log when a running backup completes', () => {
		const invalidate = walk( [ 'loading', 'in-progress', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 1 );
		expect( invalidate ).toHaveBeenCalledWith( ACTIVITY_LOG_ROOT );
	} );

	it( 'stays quiet on a screen where no backup was ever running', () => {
		const invalidate = walk( [ 'loading', 'complete', 'complete' ] );

		expect( invalidate ).not.toHaveBeenCalled();
	} );

	// `useBackups`' most common failure mode — a non-200 from WPCOM
	// served as HTTP 200 with a `null` body — lands here. There is no new
	// restore point to fetch, and `pollInterval()` deliberately stops
	// polling rather than hammering an upstream that just failed.
	it( 'does not refresh when a running backup drops to an error', () => {
		const invalidate = walk( [ 'in-progress', 'error' ] );

		expect( invalidate ).not.toHaveBeenCalled();
	} );

	// The positive control for the case above: the run is remembered
	// across the failed poll, so the reader's retry still refreshes the
	// list. A previous-state comparison would have forgotten it.
	it( 'still refreshes when the run is only seen to end after a failed poll', () => {
		const invalidate = walk( [ 'in-progress', 'error', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 1 );
		expect( invalidate ).toHaveBeenCalledWith( ACTIVITY_LOG_ROOT );
	} );

	// WPCOM logs a failed attempt as its own activity row, so both
	// no-restore-point outcomes are worth a refresh.
	it.each( [ 'will-retry', 'no-good-backups' ] as BackupsState[] )(
		'refreshes when a running backup ends in %s',
		state => {
			const invalidate = walk( [ 'in-progress', state ] );

			expect( invalidate ).toHaveBeenCalledTimes( 1 );
		}
	);

	// Nothing new has run, so the retry that recovers from a failed poll
	// on an idle screen must not refresh the list a second time.
	it( 'does not refresh again when a later poll fails and recovers', () => {
		const invalidate = walk( [ 'in-progress', 'complete', 'error', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 1 );
	} );

	// Two finished backups in one session — a reader who clicks "Back up
	// now" twice — must each get their own refresh.
	it( 'arms again for the next run', () => {
		const invalidate = walk( [ 'in-progress', 'complete', 'in-progress', 'complete' ] );

		expect( invalidate ).toHaveBeenCalledTimes( 2 );
	} );
} );
