import { expect } from 'chai';

import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState
} from '../reducer';

describe( 'items reducer', () => {
	it( 'state should default to empty object', () => {
		const stateOut = itemsReducer( undefined, {} );
		expect( stateOut ).to.be.empty;
	} );

	let settings = {
		a: {
			name: 'setting-a'
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
				settings: settings
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
					setting_name: 'new-value'
				}
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut.setting_name ).to.equal( 'new-value' );
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
				type: 'JETPACK_SETTINGS_FETCH'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).to.be.true;
		} );

		it( 'should set fetchingSettingsList to false when setting was updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_RECEIVE'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).to.be.false;
		} );

		it( 'should set fetchingSettingsList to false when updating a setting failed', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).to.be.false;
		} );
	} );

	describe( '#settingUpdate', () => {
		it( 'should set updatingSetting to true when updating a setting', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTING_UPDATE'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.updatingSetting ).to.be.true;
		} );

		it( 'should set updatingSetting to false when a setting was updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.updatingSetting ).to.be.false;
		} );
	} );
} );
