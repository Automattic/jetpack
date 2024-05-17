import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState,
} from '../reducer';

const settings = {
	tracks_opt_out: false,
};

describe( 'items reducer', () => {
	test( 'state should default to empty object', () => {
		const stateOut = itemsReducer( undefined, {} );

		expect( Object.keys( stateOut ) ).toHaveLength( 0 );
	} );

	describe( '#trackingSettingsFetch', () => {
		test( 'should fetch settings', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH_SUCCESS',
				settings: settings,
			};
			const stateOut = itemsReducer( stateIn, action );

			expect( stateOut.tracks_opt_out ).toBe( false );
		} );
	} );

	describe( '#trackingSettingsUpdate', () => {
		test( 'should update settings', () => {
			const stateIn = settings;
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE_SUCCESS',
				updatedSettings: { tracks_opt_out: true },
			};
			const stateOut = itemsReducer( stateIn, action );

			expect( stateOut.tracks_opt_out ).toBe( true );
		} );
	} );
} );

describe( 'requests reducer', () => {
	test( 'state should default to initialRequestsState', () => {
		const stateOut = requestsReducer( undefined, {} );

		expect( stateOut ).toEqual( initialRequestsState );
	} );

	describe( '#trackingSettingsFetch', () => {
		test( 'should set fetchingTrackingSettings to true when fetching', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );

			expect( stateOut.fetchingTrackingSettings ).toBe( true );
		} );

		test( 'should set fetchingTrackingSettings to false when updated', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );

			expect( stateOut.fetchingTrackingSettings ).toBe( false );
		} );

		test( 'should set fetchingTrackingSettings to false when updating failed', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );

			expect( stateOut.fetchingTrackingSettings ).toBe( false );
		} );
	} );

	describe( '#trackingSettingsUpdate', () => {
		test( 'should set updatingTrackingSettings to true when updating', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE',
				updatedSettings: { tracks_opt_out: true },
			};
			const stateOut = requestsReducer( stateIn, action );

			expect( stateOut.updatingTrackingSettings ).toBe( true );
		} );

		test( 'should set updatingTrackingSettings to false when updated', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE_SUCCESS',
				updatedSettings: { tracks_opt_out: true },
			};
			const stateOut = requestsReducer( stateIn, action );

			expect( stateOut.updatingTrackingSettings ).toBe( false );
		} );

		test( 'should set updatingTrackingSettings to false when updating failed', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE_FAIL',
				updatedSettings: { tracks_opt_out: true },
			};
			const stateOut = requestsReducer( stateIn, action );

			expect( stateOut.updatingTrackingSettings ).toBe( false );
		} );
	} );
} );
