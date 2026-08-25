import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { isUsableBackup, isWillRetryStatus, summarizeBackups, useBackups } from '../use-backups';
import type { RawBackupEntry } from '../../data/api/backups';
import type { Backup } from '../../types/backup';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * A normalized backup, defaulting to a usable restore point.
 *
 * @param overrides - Fields to replace.
 * @return A backup.
 */
function backup( overrides: Partial< Backup > = {} ): Backup {
	return {
		id: '1',
		status: 'finished',
		percent: 100,
		isBackup: true,
		isDiscarded: false,
		hasStats: true,
		...overrides,
	};
}

describe( 'isWillRetryStatus', () => {
	it( 'matches the whole retryable family, not just `error-will-retry`', () => {
		// The legacy client compares against `error-will-retry` alone,
		// while WPCOM ships `<reason>-will-retry` variants that it silently
		// fails to recognize.
		expect( isWillRetryStatus( 'error-will-retry' ) ).toBe( true );
		expect( isWillRetryStatus( 'credential-error-will-retry' ) ).toBe( true );
		expect( isWillRetryStatus( 'finished' ) ).toBe( false );
		expect( isWillRetryStatus( 'not-accessible' ) ).toBe( false );
	} );
} );

describe( 'isUsableBackup', () => {
	it( 'requires finished, with stats, and not discarded', () => {
		expect( isUsableBackup( backup() ) ).toBe( true );
		expect( isUsableBackup( backup( { status: 'started' } ) ) ).toBe( false );
		expect( isUsableBackup( backup( { hasStats: false } ) ) ).toBe( false );
		expect( isUsableBackup( backup( { isDiscarded: true } ) ) ).toBe( false );
	} );
} );

describe( 'summarizeBackups', () => {
	it( 'reports a site with no records as the first run', () => {
		expect( summarizeBackups( [] ) ).toEqual( {
			state: 'no-backups',
			progress: 0,
			isInitialBackup: true,
		} );
	} );

	it( 'reports a first backup in flight, with its progress', () => {
		const summary = summarizeBackups( [
			backup( { status: 'started', percent: 10, hasStats: false } ),
		] );

		expect( summary.state ).toBe( 'in-progress' );
		expect( summary.progress ).toBe( 10 );
		expect( summary.isInitialBackup ).toBe( true );
	} );

	it( 'does not call a backup the first one when restore points already exist', () => {
		const summary = summarizeBackups( [
			backup( { id: 'running', status: 'started', percent: 30, hasStats: false } ),
			backup( { id: 'done' } ),
		] );

		expect( summary.state ).toBe( 'in-progress' );
		expect( summary.isInitialBackup ).toBe( false );
	} );

	it( 'clamps a percentage outside the range a progress bar can use', () => {
		expect(
			summarizeBackups( [ backup( { status: 'started', percent: 150, hasStats: false } ) ] )
				.progress
		).toBe( 100 );
	} );

	it( 'reports a retry while there is nothing good to fall back on', () => {
		expect(
			summarizeBackups( [
				backup( { status: 'error-will-retry', hasStats: false } ),
				backup( { status: 'error-will-retry', hasStats: false } ),
			] ).state
			// The legacy check is `backups.length === 1 && …`, so a second
			// failed attempt makes this state disappear entirely.
		).toBe( 'will-retry' );
	} );

	it( 'stays `complete` when a failed attempt follows a good backup', () => {
		// From the reader's point of view the site is still backed up.
		expect(
			summarizeBackups( [
				backup( { status: 'error-will-retry', hasStats: false } ),
				backup( { id: 'good' } ),
			] ).state
		).toBe( 'complete' );
	} );

	it( 'reports discarded and stats-less backups as no good backups', () => {
		expect( summarizeBackups( [ backup( { isDiscarded: true } ) ] ).state ).toBe(
			'no-good-backups'
		);
		expect( summarizeBackups( [ backup( { hasStats: false } ) ] ).state ).toBe( 'no-good-backups' );
		expect(
			summarizeBackups( [ backup( { status: 'not-accessible', hasStats: false } ) ] ).state
		).toBe( 'no-good-backups' );
	} );

	it( 'reports a usable restore point as complete', () => {
		expect( summarizeBackups( [ backup() ] ).state ).toBe( 'complete' );
	} );
} );

/**
 * Fresh client per test so the module singleton's cache can't leak, and
 * no retries so an error assertion doesn't wait out react-query's backoff.
 *
 * @return A wrapper providing an isolated QueryClient.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

beforeEach( () => {
	mockedApiFetch.mockReset();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'useBackups', () => {
	it( 'derives state from the list', async () => {
		const raw: RawBackupEntry[] = [
			{
				id: '1',
				started: '2026-08-14 17:25:46',
				last_updated: '2026-08-14 17:36:04',
				status: 'started',
				period: '1786728342',
				percent: '10',
				is_backup: '1',
				is_scan: '1',
			},
		];
		mockedApiFetch.mockResolvedValue( raw );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useBackups(), { wrapper } );

		await waitFor( () => expect( result.current.state ).toBe( 'in-progress' ) );
		expect( result.current.progress ).toBe( 10 );
		expect( result.current.isInitialBackup ).toBe( true );
	} );

	// The regression this hook exists to avoid. `get_recent_backups()`
	// returns bare `null` on any non-200 from WPCOM, which WordPress
	// serves as HTTP 200 — so the request RESOLVES and no error is ever
	// thrown. The legacy selector coerces that to `[]`, which reads as
	// "this site has no backups" and shows a paying customer the
	// brand-new-site screen every time WPCOM has a bad minute.
	it( 'reports a null body as an error rather than as an empty site', async () => {
		mockedApiFetch.mockResolvedValue( null );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useBackups(), { wrapper } );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.state ).not.toBe( 'no-backups' );
	} );

	it( 'reports a genuinely empty list as the first run', async () => {
		mockedApiFetch.mockResolvedValue( [] );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useBackups(), { wrapper } );

		await waitFor( () => expect( result.current.state ).toBe( 'no-backups' ) );
	} );

	it( 'asks WPCOM nothing when the site has no user connection', async () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: { isRegistered: false, hasConnectedOwner: false, isUserConnected: false },
		} as typeof window.JP_CONNECTION_INITIAL_STATE;
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useBackups(), { wrapper } );

		expect( result.current.state ).toBe( 'loading' );
		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	// The invalidation this hook used to own lives in
	// `useRefreshActivityOnBackupComplete`, mounted once by the Overview
	// screen. It has to stay out of here: `BackupNowButton` mounts a
	// second `useBackups` on that same screen, and a per-observer
	// invalidation costs a second WPCOM round trip that the first one's
	// in-flight refetch is silently cancelled for.
	it( 'invalidates nothing itself when an in-progress backup finishes', async () => {
		const inProgress: RawBackupEntry[] = [
			{
				id: '1',
				started: '2026-08-14 17:25:46',
				last_updated: '2026-08-14 17:36:04',
				status: 'started',
				period: '1786728342',
				percent: '50',
				is_backup: '1',
				is_scan: '0',
			},
		];
		const finished: RawBackupEntry[] = [
			{
				...inProgress[ 0 ],
				status: 'finished',
				percent: '100',
				last_updated: '2026-08-14 17:36:10',
				stats: { plugins: {} },
			},
		];
		mockedApiFetch.mockResolvedValueOnce( inProgress ).mockResolvedValue( finished );
		const { client, wrapper } = makeWrapper();
		const invalidate = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useBackups(), { wrapper } );
		await waitFor( () => expect( result.current.state ).toBe( 'in-progress' ) );

		act( () => result.current.refetch() );
		await waitFor( () => expect( result.current.state ).toBe( 'complete' ) );

		expect( invalidate ).not.toHaveBeenCalled();
	} );
} );
