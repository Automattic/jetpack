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
		},
		fetchingState: {
			isFetching: true,
			loaded: false,
			backups: [],
		},
		failedState: {
			isFetching: false,
			loaded: true,
			backups: [],
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
	} );
} );
