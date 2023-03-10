import {
	getTrackingSettings,
	isFetchingTrackingSettingsList,
	isUpdatingTrackingSettings,
} from '../reducer';

const state = {
	jetpack: {
		trackingSettings: {
			items: {
				tracks_opt_out: false,
			},
			requests: {
				fetchingTrackingSettings: true,
				updatingTrackingSettings: true,
			},
		},
	},
};

describe( 'items selectors', () => {
	describe( '#getTrackingSettings', () => {
		test( 'should return state.jetpack.trackingSettings.items', () => {
			const output = getTrackingSettings( state );
			expect( output ).toEqual( state.jetpack.trackingSettings.items );
		} );
	} );
} );

describe( 'requests selectors', () => {
	describe( '#isFetchingTrackingSettings', () => {
		test( 'should return state.jetpack.trackingSettings.requests.isFetchingTrackingSettings', () => {
			expect( isFetchingTrackingSettingsList( state ) ).toBe( true );
		} );
	} );

	describe( '#isUpdatingTrackingSettings', () => {
		test( 'should return state.jetpack.trackingSettings.requests.isUpdatingTrackingSettings', () => {
			expect( isUpdatingTrackingSettings( state ) ).toBe( true );
		} );
	} );
} );
