import { expect } from '@jest/globals';
import selectors from '../site-backup';

describe( 'siteBackupsSelectors', () => {
	const fixtures = {
		emptyObject: {
			siteBackups: {},
		},
		initialState: {
			siteBackups: {
				isFetching: false,
				loaded: false,
				backups: [],
			},
		},
		fetchingState: {
			siteBackups: {
				isFetching: true,
				loaded: false,
				backups: [],
			},
		},
		failedState: {
			siteBackups: {
				isFetching: false,
				loaded: false,
				backups: [],
			},
		},
		successState: {
			siteBackups: {
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
	};

	describe( 'getBackups()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: [],
			},
			{
				state: fixtures.initialState,
				expected: [],
			},
			{
				state: fixtures.fetchingState,
				expected: [],
			},
			{
				state: fixtures.failedState,
				expected: [],
			},
			{
				state: fixtures.successState,
				expected: fixtures.successState.siteBackups.backups,
			},
		] )( 'should return backups array', ( { state, expected } ) => {
			const output = selectors.getBackups( state );
			expect( output ).toEqual( expected );
		} );
	} );

	describe( 'hasLoadedBackups()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: undefined,
			},
			{
				state: fixtures.initialState,
				expected: false,
			},
			{
				state: fixtures.fetchingState,
				expected: false,
			},
			{
				state: fixtures.failedState,
				expected: false,
			},
			{
				state: fixtures.successState,
				expected: true,
			},
		] )( 'should return loaded status', ( { state, expected } ) => {
			const output = selectors.hasLoadedBackups( state );
			expect( output ).toBe( expected );
		} );
	} );

	describe( 'isFetchingBackups()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: undefined,
			},
			{
				state: fixtures.initialState,
				expected: false,
			},
			{
				state: fixtures.fetchingState,
				expected: true,
			},
			{
				state: fixtures.failedState,
				expected: false,
			},
			{
				state: fixtures.successState,
				expected: false,
			},
		] )( 'should return fetching status', ( { state, expected } ) => {
			const output = selectors.isFetchingBackups( state );
			expect( output ).toBe( expected );
		} );
	} );
} );
