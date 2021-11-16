import { expect } from 'chai';

import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState,
} from '../reducer';

describe( 'items reducer', () => {
	it( 'state should default to empty object', () => {
		const stateOut = itemsReducer( undefined, {} );
		expect( stateOut ).to.be.empty;
	} );

	let settings = {
		a: {
			name: 'setting-a',
		},
		b: {
			name: 'setting-b',
		},
	};

	describe( '#settingsFetch', () => {
		it( 'should replace .items with the settings list', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_RECEIVE',
				settings: settings,
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( Object.keys( stateOut ).length ).to.equal( Object.keys( action.settings ).length );
		} );
	} );

	describe( '#settingsUpdate', () => {
		it( 'should update a setting', () => {
			const stateIn = settings;
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				updatedOption: {
					setting_name: 'new-value',
				},
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut.setting_name ).to.equal( 'new-value' );
		} );
	} );

	describe( '#multipleSettingsUpdate', () => {
		it( 'should update multiple settings', () => {
			const stateIn = settings;
			const action = {
				type: 'JETPACK_SETTINGS_UPDATE_SUCCESS',
				updatedOptions: {
					setting_name: 'new-value',
					setting_name_other: 'other-new-value',
				},
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut.setting_name ).to.equal( 'new-value' );
			expect( stateOut.setting_name_other ).to.equal( 'other-new-value' );
		} );
	} );

	describe( '#initialState', () => {
		it( "should replace .items with the initial state's settings list", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SET_INITIAL_STATE',
				initialState: {
					settings: settings,
				},
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut ).to.eql( action.initialState.settings );
		} );
	} );
} );

describe( 'requests reducer', () => {
	it( 'state should default to initialRequestsState', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).to.equal( initialRequestsState );
	} );

	describe( '#settingsFetch', () => {
		it( 'should set fetchingSettingsList to true when fetching', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH',
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).to.be.true;
		} );

		it( 'should set fetchingSettingsList to false when setting was updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_RECEIVE',
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).to.be.false;
		} );

		it( 'should set fetchingSettingsList to false when updating a setting failed', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_FAIL',
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).to.be.false;
		} );
	} );

	describe( '#settingUpdate', () => {
		it( 'should set settingsSent to true when updating a setting', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTING_UPDATE',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).to.be.true;
			expect( stateOut.settingsSent.settingTwo ).to.be.true;
		} );

		it( 'should set settingsSent to false when a setting was updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).to.be.false;
			expect( stateOut.settingsSent.settingTwo ).to.be.false;
		} );

		it( 'should set updatedSettings to true when a setting was successfully updated', () => {
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				success: { success: true },
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( null, action );
			expect( stateOut.updatedSettings.settingOne ).to.be.true;
			expect( stateOut.updatedSettings.settingTwo ).to.be.true;
		} );
		it( 'should set updatedSettings to false when a setting failed to update', () => {
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				success: false,
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( null, action );
			expect( stateOut.updatedSettings.settingOne ).to.be.false;
			expect( stateOut.updatedSettings.settingTwo ).to.be.false;
		} );
	} );

	describe( '#multipleSettingsUpdate', () => {
		it( 'should set updatingSetting to true when updating multiple settings', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_UPDATE',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).to.be.true;
			expect( stateOut.settingsSent.settingTwo ).to.be.true;
		} );

		it( 'should set updatingSetting to false when settings were updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_UPDATE_SUCCESS',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).to.be.false;
			expect( stateOut.settingsSent.settingTwo ).to.be.false;
		} );
	} );
} );
