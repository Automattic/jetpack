import {
	isFetchingSettingsList,
	isUpdatingSetting,
	isSettingActivated,
	getSettings,
	getSetting,
} from '../reducer';

const state = {
	jetpack: {
		settings: {
			items: {
				'setting-a': false,
				'setting-b': true,
				'setting-numeric': 10,
				'setting-string': 'Hocus Pocus',
			},
			requests: {
				fetchingSettingsList: true,
				settingsSent: {
					'setting-a': true,
					'setting-b': true,
					'setting-numeric': true,
					'setting-string': true,
				},
			},
		},
	},
};

describe( 'requests selectors', () => {
	describe( '#isFetchingSettingsList', () => {
		test( 'should return state.jetpack.settings.requests.fetchingSettingsList', () => {
			const output = isFetchingSettingsList( state );
			expect( output ).toEqual( state.jetpack.settings.requests.fetchingSettingsList );
		} );
	} );

	describe( '#isUpdatingSetting', () => {
		test( 'should return state.jetpack.settings.requests.settingsSent', () => {
			const output = isUpdatingSetting( state, [ 'setting-a' ] );
			expect( output ).toEqual( state.jetpack.settings.requests.settingsSent[ 'setting-a' ] );
		} );
	} );
} );

describe( 'items selectors', () => {
	describe( '#isSettingActivated', () => {
		test( 'should return state.jetpack.settings.items[ setting-slug ]', () => {
			const output = isSettingActivated( state, 'setting-a' );
			expect( output ).toEqual( state.jetpack.settings.items[ 'setting-a' ] );
			const output2 = isSettingActivated( state, 'setting-b' );
			expect( output2 ).toEqual( state.jetpack.settings.items[ 'setting-b' ] );
		} );
	} );

	describe( '#getSettings', () => {
		test( 'should return state.jetpack.settings.items', () => {
			const output2 = getSettings( state );
			expect( output2 ).toEqual( state.jetpack.settings.items );
		} );
	} );

	describe( '#getSetting', () => {
		test( 'should return a setting by its key', () => {
			expect( getSetting( state, 'setting-numeric' ) ).toEqual(
				state.jetpack.settings.items[ 'setting-numeric' ]
			);
			expect( getSetting( state, 'setting-string' ) ).toEqual(
				state.jetpack.settings.items[ 'setting-string' ]
			);
		} );
	} );
} );
