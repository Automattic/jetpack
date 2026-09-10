import { expect } from '@jest/globals';
import {
	SITE_BACKUPS_GET,
	SITE_BACKUPS_GET_SUCCESS,
	SITE_BACKUPS_GET_FAILED,
} from '../../actions/types';
import siteBackups from '../site-backups';

describe( 'reducer', () => {
	const fixtures = {
		initialState: {
			isFetching: false,
			loaded: false,
			backups: [],
			fetchFailed: false,
		},
		fetchingState: {
			isFetching: true,
			loaded: false,
			backups: [],
			fetchFailed: false,
		},
		// The flag the dashboard reads to tell "this site has no backups"
		// apart from "we could not find out". Both leave `backups` empty.
		failedState: {
			isFetching: false,
			loaded: true,
			backups: [],
			fetchFailed: true,
		},
	};

	describe( 'siteBackups()', () => {
		it.each( [
			{
				state: undefined,
				action: {},
				expected: fixtures.initialState,
			},
			{
				state: fixtures.initialState,
				action: { type: SITE_BACKUPS_GET },
				expected: fixtures.fetchingState,
			},
			{
				state: fixtures.initialState,
				action: {
					type: SITE_BACKUPS_GET_SUCCESS,
					payload: [
						{
							id: '588085172',
							started: '2024-06-26 11:40:54',
							last_updated: '2024-06-26 11:44:55',
							status: 'not-accessible',
							period: '1719402052',
							percent: '0',
							is_backup: '1',
							is_scan: '0',
						},
						{
							id: '588003950',
							started: '2024-06-26 06:36:08',
							last_updated: '2024-06-26 06:39:05',
							status: 'finished',
							period: '1719383767',
							percent: '100',
							is_backup: '1',
							is_scan: '0',
							has_snapshot: true,
							discarded: '0',
							stats: {},
						},
					],
				},
				expected: {
					isFetching: false,
					loaded: true,
					fetchFailed: false,
					backups: [
						{
							id: '588085172',
							started: '2024-06-26 11:40:54',
							last_updated: '2024-06-26 11:44:55',
							status: 'not-accessible',
							period: '1719402052',
							percent: '0',
							is_backup: '1',
							is_scan: '0',
						},
						{
							id: '588003950',
							started: '2024-06-26 06:36:08',
							last_updated: '2024-06-26 06:39:05',
							status: 'finished',
							period: '1719383767',
							percent: '100',
							is_backup: '1',
							is_scan: '0',
							has_snapshot: true,
							discarded: '0',
							stats: {},
						},
					],
				},
			},
			{
				state: fixtures.initialState,
				action: {
					type: SITE_BACKUPS_GET_FAILED,
				},
				expected: fixtures.failedState,
			},
		] )( 'should return expected state', ( { state, action, expected } ) => {
			expect( siteBackups( state, action ) ).toEqual( expected );
		} );

		// A poll tick that fails against a site that already loaded its list
		// must not blank the screen: what is on it is still the last thing
		// WordPress.com actually said.
		it( 'keeps an already-loaded list when a later read fails', () => {
			const loaded = siteBackups( fixtures.initialState, {
				type: SITE_BACKUPS_GET_SUCCESS,
				payload: [ { id: '588003950', status: 'finished', discarded: '0' } ],
			} );

			const afterFailure = siteBackups( loaded, { type: SITE_BACKUPS_GET_FAILED } );

			expect( afterFailure.backups ).toEqual( loaded.backups );
			expect( afterFailure.fetchFailed ).toBe( true );
		} );

		it( 'clears the failure once a read succeeds again', () => {
			const failed = siteBackups( fixtures.initialState, { type: SITE_BACKUPS_GET_FAILED } );

			const recovered = siteBackups( failed, {
				type: SITE_BACKUPS_GET_SUCCESS,
				payload: [ { id: '588003950', status: 'finished', discarded: '0' } ],
			} );

			expect( recovered.fetchFailed ).toBe( false );
		} );
	} );
} );
