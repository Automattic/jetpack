import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState,
} from '../reducer';

describe( 'items reducer', () => {
	test( 'state should default to empty object', () => {
		const stateOut = itemsReducer( undefined, {} );
		expect( Object.keys( stateOut ) ).toHaveLength( 0 );
	} );

	const settings = {
		a: {
			name: 'setting-a',
		},
		b: {
			name: 'setting-b',
		},
	};

	describe( '#settingsFetch', () => {
		test( 'should replace .items with the settings list', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_RECEIVE',
				settings: settings,
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( Object.keys( stateOut ) ).toHaveLength( Object.keys( action.settings ).length );
		} );
	} );

	describe( '#settingsUpdate', () => {
		test( 'should update a setting', () => {
			const stateIn = settings;
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				updatedOption: {
					setting_name: 'new-value',
				},
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( stateOut.setting_name ).toBe( 'new-value' );
		} );
	} );

	describe( '#multipleSettingsUpdate', () => {
		test( 'should update multiple settings', () => {
			const stateIn = settings;
			const action = {
				type: 'JETPACK_SETTINGS_UPDATE_SUCCESS',
				updatedOptions: {
					setting_name: 'new-value',
					setting_name_other: 'other-new-value',
				},
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( stateOut.setting_name ).toBe( 'new-value' );
			expect( stateOut.setting_name_other ).toBe( 'other-new-value' );
		} );
	} );

	describe( '#initialState', () => {
		test( "should replace .items with the initial state's settings list", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SET_INITIAL_STATE',
				initialState: {
					settings: settings,
				},
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( stateOut ).toEqual( action.initialState.settings );
		} );
	} );
} );

describe( 'requests reducer', () => {
	test( 'state should default to initialRequestsState', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).toEqual( initialRequestsState );
	} );

	describe( '#settingsFetch', () => {
		test( 'should set fetchingSettingsList to true when fetching', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).toBe( true );
		} );

		test( 'should set fetchingSettingsList to false when setting was updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_RECEIVE',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).toBe( false );
		} );

		test( 'should set fetchingSettingsList to false when updating a setting failed', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingSettingsList ).toBe( false );
		} );
	} );

	describe( '#settingUpdate', () => {
		test( 'should set settingsSent to true when updating a setting', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTING_UPDATE',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).toBe( true );
			expect( stateOut.settingsSent.settingTwo ).toBe( true );
		} );

		test( 'should set settingsSent to false when a setting was updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).toBe( false );
			expect( stateOut.settingsSent.settingTwo ).toBe( false );
		} );

		test( 'should set updatedSettings to true when a setting was successfully updated', () => {
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				success: { success: true },
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( null, action );
			expect( stateOut.updatedSettings.settingOne ).toBe( true );
			expect( stateOut.updatedSettings.settingTwo ).toBe( true );
		} );
		test( 'should set updatedSettings to false when a setting failed to update', () => {
			const action = {
				type: 'JETPACK_SETTING_UPDATE_SUCCESS',
				success: false,
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( null, action );
			expect( stateOut.updatedSettings.settingOne ).toBe( false );
			expect( stateOut.updatedSettings.settingTwo ).toBe( false );
		} );
	} );

	describe( '#multipleSettingsUpdate', () => {
		test( 'should set updatingSetting to true when updating multiple settings', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_UPDATE',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).toBe( true );
			expect( stateOut.settingsSent.settingTwo ).toBe( true );
		} );

		test( 'should set updatingSetting to false when settings were updated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SETTINGS_UPDATE_SUCCESS',
				updatedOptions: {
					settingOne: 'new-value-one',
					settingTwo: 'new-value-two',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.settingsSent.settingOne ).toBe( false );
			expect( stateOut.settingsSent.settingTwo ).toBe( false );
		} );
	} );
} );
