import { expect } from 'chai';

import {
	isFetchingSettingsList,
	isUpdatingSetting,
	isSettingActivated,
	getSettings,
	getSetting
} from '../reducer';

let state = {
	jetpack: {
		settings: {
			items: {
				'setting-a': false,
				'setting-b': true,
				'setting-numeric': 10,
				'setting-string': 'Hocus Pocus'
			},
			requests: {
				fetchingSettingsList: true,
				settingsSent: {
					'setting-a': true,
					'setting-b': true,
					'setting-numeric': true,
					'setting-string': true
				}
			}
		}
	}
};

describe( 'requests selectors', () => {
	describe( '#isFetchingSettingsList', () => {
		it( 'should return state.jetpack.settings.requests.fetchingSettingsList', () => {
			const output = isFetchingSettingsList( state );
			expect( output ).to.equal( state.jetpack.settings.requests.fetchingSettingsList );
		} );
	} );

	describe( '#isUpdatingSetting', () => {
		it( 'should return state.jetpack.settings.requests.settingsSent', () => {
			const output = isUpdatingSetting( state, [ 'setting-a' ] );
			expect( output ).to.equal( state.jetpack.settings.requests.settingsSent[ 'setting-a' ] );
		} );
	} );
} );

describe( 'items selectors', () => {
	describe( '#isSettingActivated', () => {
		it( 'should return state.jetpack.settings.items[ setting-slug ]', () => {
			const output = isSettingActivated( state, 'setting-a' );
			expect( output ).to.equal( state.jetpack.settings.items[ 'setting-a' ] );
			const output2 = isSettingActivated( state, 'setting-b' );
			expect( output2 ).to.equal( state.jetpack.settings.items[ 'setting-b' ] );
		} );
	} );

	describe( '#getSettings', () => {
		it( 'should return state.jetpack.settings.items', () => {
			const output2 = getSettings( state );
			expect( output2 ).to.eql( state.jetpack.settings.items );
		} );
	} );

	describe( '#getSetting', () => {
		it( 'should return a setting by its key', () => {
			expect( getSetting( state, 'setting-numeric' ) )
				.to.eql( state.jetpack.settings.items[ 'setting-numeric' ] );
			expect( getSetting( state, 'setting-string' ) )
				.to.eql( state.jetpack.settings.items[ 'setting-string' ] );
		} );
	} );
} );
