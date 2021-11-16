import { expect } from 'chai';

import {
	getTrackingSettings,
	isFetchingTrackingSettingsList,
	isUpdatingTrackingSettings,
} from '../reducer';

let state = {
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
		it( 'should return state.jetpack.trackingSettings.items', () => {
			const output = getTrackingSettings( state );
			expect( output ).to.equal( state.jetpack.trackingSettings.items );
		} );
	} );
} );

describe( 'requests selectors', () => {
	describe( '#isFetchingTrackingSettings', () => {
		it( 'should return state.jetpack.trackingSettings.requests.isFetchingTrackingSettings', () => {
			expect( isFetchingTrackingSettingsList( state ) ).to.be.true;
		} );
	} );

	describe( '#isUpdatingTrackingSettings', () => {
		it( 'should return state.jetpack.trackingSettings.requests.isUpdatingTrackingSettings', () => {
			expect( isUpdatingTrackingSettings( state ) ).to.be.true;
		} );
	} );
} );
