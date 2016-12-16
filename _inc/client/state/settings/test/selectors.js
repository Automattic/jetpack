import { expect } from 'chai';

import {
	isFetchingSettingsList,
	isUpdatingSetting,
	isSettingActivated,
	getSettings
} from '../reducer';

let state = {
	jetpack: {
		settings: {
			items: {
				'setting-a': false,
				'setting-b': true
			},
			requests: {
				fetchingSettingsList: true,
				updatingSetting: true
			}
		}
	}
};

describe( 'requests selectors', () => {
	describe( '#isFetchingSettingsList', () => {
		it( 'should return state.jetpack.settings.requests.fetchingSettingsList', () => {
			const stateIn = state;
			const output = isFetchingSettingsList( stateIn );
			expect( output ).to.equal( state.jetpack.settings.requests.fetchingSettingsList );
		} );
	} );

	describe( '#isUpdatingSetting', () => {
		it( 'should return state.jetpack.settings.requests.updatingSetting', () => {
			const stateIn = state;
			const output = isUpdatingSetting( stateIn );
			expect( output ).to.equal( state.jetpack.settings.requests.updatingSetting );
		} );
	} );
} );

describe( 'items selectors', () => {
	describe( '#isSettingActivated', () => {
		it( 'should return state.jetpack.settings.items[ setting-slug ]', () => {
			const stateIn = state;
			const output = isSettingActivated( stateIn, 'setting-a' );
			expect( output ).to.equal( state.jetpack.settings.items[ 'setting-a' ] );
			const output2 = isSettingActivated( stateIn, 'setting-b' );
			expect( output2 ).to.equal( state.jetpack.settings.items[ 'setting-b' ] );
		} );
	} );

	describe( '#getSettings', () => {
		it( 'should return state.jetpack.settings.items', () => {
			const stateIn = state;
			const output2 = getSettings( stateIn );
			expect( output2 ).to.eql( state.jetpack.settings.items );
		} );
	} );
} );
