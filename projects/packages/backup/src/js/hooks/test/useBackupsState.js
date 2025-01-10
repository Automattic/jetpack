import { renderHook, waitFor } from '@testing-library/react';
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

	beforeEach( () => {
		dispatchMock = {
			getBackups: jest.fn(),
		};
		useDispatch.mockReturnValue( dispatchMock );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'backupState should be NO_BACKUPS when the site has no backups', async () => {
		// Provide a mock implementation for useSelect
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.no_backups,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
				} ) );
			}
			return [];
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_BACKUPS );
		} );
	} );

	it( 'backupState should be NO_BACKUPS_RETRY when last backup has a retry state', async () => {
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.no_backups_retry,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
				} ) );
			}
			return [];
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_BACKUPS_RETRY );
		} );
	} );

	it( 'backupState should be COMPLETE when last backup has finished successfully', async () => {
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.complete,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
				} ) );
			}
			return [];
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.COMPLETE );
		} );
	} );

	it( 'backupState should be NO_GOOD_BACKUPS when last backup finished with no stats', async () => {
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.no_good_backups,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
				} ) );
			}
			return [];
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_GOOD_BACKUPS );
		} );
	} );

	it( 'backupState should be NO_GOOD_BACKUPS when last backup finished as discarded', async () => {
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.discarded,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
				} ) );
			}
			return [];
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.NO_GOOD_BACKUPS );
		} );
	} );

	it( 'backupState should be COMPLETE by selecting the latest non-discarded finished backup', async () => {
		useSelect.mockImplementation( selector => {
			if ( typeof selector === 'function' ) {
				return selector( () => ( {
					getBackups: () => fixtures.complete_and_discarded,
					isFetchingBackups: () => false,
					hasLoadedBackups: () => true,
				} ) );
			}
			return [];
		} );

		const { result } = renderHook( () => useBackupsState() );

		await waitFor( () => {
			expect( result.current.backupState ).toBe( BACKUP_STATE.COMPLETE );
		} );
	} );
} );
