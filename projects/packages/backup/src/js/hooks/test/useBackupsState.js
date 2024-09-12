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
} );
