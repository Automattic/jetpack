import { act, renderHook, waitFor } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { BACKUP_STATE } from '../../constants';
import useBackupsState from '../useBackupsState';

const fixtures = {
	no_backups: [],
	no_backups_retry: [
		{
			id: 123456,
			started: '2023-01-01 02:16:32',
			last_updated: '2023-01-01 02:16:34',
			status: 'error-will-retry',
			period: 1672530000,
			percent: 0,
			is_backup: 1,
			is_scan: 0,
		},
	],
	discarded: [
		{
			id: 381971090,
			started: '2023-01-01 02:16:32',
			last_updated: '2023-01-01 02:16:34',
			status: 'finished',
			period: 1672530000,
			percent: 100,
			is_backup: 1,
			is_scan: 0,
			has_warnings: false,
			discarded: '1',
			stats: {
				prefix: 'wp_',
				plugins: { count: 100 },
				themes: { count: 100 },
				uploads: { count: 100 },
				tables: {
					wp_posts: {
						post_published: 100,
					},
				},
			}, // full stats details are not required currently
		},
	],
	complete: [
		{
			id: 381971090,
			started: '2023-01-01 02:16:32',
			last_updated: '2023-01-01 02:16:34',
			status: 'finished',
			period: 1672530000,
			percent: 100,
			is_backup: 1,
			is_scan: 0,
			has_warnings: false,
			discarded: '0',
			stats: {
				prefix: 'wp_',
				plugins: { count: 100 },
				themes: { count: 100 },
				uploads: { count: 100 },
				tables: {
					wp_posts: {
						post_published: 100,
					},
				},
			}, // full stats details are not required currently
		},
	],
	no_good_backups: [
		{
			id: 123456,
			started: '2023-01-01 02:16:32',
			last_updated: '2023-01-01 02:16:34',
			status: 'finished',
			period: 1672530000,
			percent: 0,
			is_backup: 1,
			is_scan: 0,
		},
	],
	complete_and_discarded: [
		{
			id: 234567,
			started: '2024-01-02 01:00:00',
			last_updated: '2024-01-02 01:05:00',
			status: 'finished',
			period: 1704157200,
			percent: 100,
			is_backup: 1,
			is_scan: 0,
			has_warnings: false,
			discarded: '1', // Discarded backup
			stats: {
				prefix: 'wp_',
				plugins: { count: 100 },
				themes: { count: 100 },
				uploads: { count: 100 },
				tables: {
					wp_posts: {
						post_published: 100,
					},
				},
			},
		},
		{
			id: 123456,
			started: '2024-01-01 01:00:00',
			last_updated: '2024-01-01 01:05:00',
			status: 'finished',
			period: 1704070800,
			percent: 100,
			is_backup: 1,
			is_scan: 0,
			has_warnings: false,
			discarded: '0', // Complete backup
			stats: {
				prefix: 'wp_',
				plugins: { count: 100 },
				themes: { count: 100 },
				uploads: { count: 100 },
				tables: {
					wp_posts: {
						post_published: 100,
					},
				},
			},
		},
	],
};

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
	combineReducers: jest.fn(),
} ) );

describe( 'useBackupsState', () => {
	let dispatchMock;

	/**
	 * Point `useSelect` at a store, defaulting to "loaded, not fetching, no
	 * failure" so each test states only what it is actually about.
	 *
	 * @param {object} overrides - Selectors to replace.
	 */
	const mockStore = ( overrides = {} ) => {
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.no_backups,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
					hasBackupsFetchFailed: () => false,
					...overrides,
				} ) );
			}
			return [];
		} );
	};

	beforeEach( () => {
		dispatchMock = {
			getBackups: jest.fn(),
		};
		useDispatch.mockReturnValue( dispatchMock );
	} );

	afterEach( () => {
		jest.clearAllMocks();
		jest.useRealTimers();
	} );

	it( 'backupState should be NO_BACKUPS when the site has no backups', async () => {
		mockStore( { getBackups: () => fixtures.no_backups } );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_BACKUPS );
		} );
	} );

	it( 'backupState should be NO_BACKUPS_RETRY when last backup has a retry state', async () => {
		mockStore( { getBackups: () => fixtures.no_backups_retry } );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_BACKUPS_RETRY );
		} );
	} );

	it( 'backupState should be COMPLETE when last backup has finished successfully', async () => {
		mockStore( { getBackups: () => fixtures.complete } );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.COMPLETE );
		} );
	} );

	it( 'backupState should be NO_GOOD_BACKUPS when last backup finished with no stats', async () => {
		mockStore( { getBackups: () => fixtures.no_good_backups } );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_GOOD_BACKUPS );
		} );
	} );

	it( 'backupState should be NO_GOOD_BACKUPS when last backup finished as discarded', async () => {
		mockStore( { getBackups: () => fixtures.discarded } );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_GOOD_BACKUPS );
		} );
	} );

	it( 'backupState should be COMPLETE by selecting the latest non-discarded finished backup', async () => {
		mockStore( { getBackups: () => fixtures.complete_and_discarded } );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.COMPLETE );
		} );
	} );

	// The regression this state exists to prevent. An empty list and a failed
	// read both arrive here as `backups: []` with `loaded: true`, so before
	// the `fetchFailed` flag a WordPress.com blip reported NO_BACKUPS and a
	// paying customer was shown the first-run "your first backup will be
	// ready soon" screen.
	it( 'backupState should be FETCH_FAILED when the read failed with nothing loaded', async () => {
		mockStore( {
			getBackups: () => fixtures.no_backups,
			hasBackupsFetchFailed: () => true,
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.FETCH_FAILED );
		} );
	} );

	// A blip on a poll tick must not throw away a screen that is already
	// showing real backups. The error state is only for having nothing.
	it( 'keeps reporting COMPLETE when a later read fails but a list is loaded', async () => {
		mockStore( {
			getBackups: () => fixtures.complete,
			hasBackupsFetchFailed: () => true,
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.COMPLETE );
		} );
	} );

	// The deliberate half of the poll decision: a failed read waits to be
	// asked rather than retrying a failing WordPress.com once a second.
	it( 'stops polling after a failed read', () => {
		jest.useFakeTimers();
		mockStore( {
			getBackups: () => fixtures.no_backups,
			hasBackupsFetchFailed: () => true,
		} );

		renderHook( () => useBackupsState() );

		act( () => {
			jest.advanceTimersByTime( 10000 );
		} );

		expect( dispatchMock.getBackups ).not.toHaveBeenCalled();
	} );

	// The control for the test above: without it, that one would pass even if
	// the hook had stopped polling entirely.
	it( 'keeps polling while the site is waiting for its first backup', () => {
		jest.useFakeTimers();
		mockStore( { getBackups: () => fixtures.no_backups } );

		renderHook( () => useBackupsState() );

		act( () => {
			jest.advanceTimersByTime( 10000 );
		} );

		expect( dispatchMock.getBackups ).toHaveBeenCalled();
	} );
} );
