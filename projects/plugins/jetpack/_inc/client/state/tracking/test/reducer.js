import { expect } from 'chai';

import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState,
} from '../reducer';

const settings = {
	tracks_opt_out: false,
};

describe( 'items reducer', () => {
	it( 'state should default to empty object', () => {
		const stateOut = itemsReducer( undefined, {} );

		expect( stateOut ).to.be.empty;
	} );

	describe( '#trackingSettingsFetch', () => {
		it( 'should fetch settings', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH_SUCCESS',
				settings: settings,
			};
			const stateOut = itemsReducer( stateIn, action );

			expect( stateOut.tracks_opt_out ).to.be.false;
		} );
	} );

	describe( '#trackingSettingsUpdate', () => {
		it( 'should update settings', () => {
			const stateIn = settings;
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE_SUCCESS',
				updatedSettings: { tracks_opt_out: true },
			};
			const stateOut = itemsReducer( stateIn, action );

			expect( stateOut.tracks_opt_out ).to.be.true;
		} );
	} );
} );

describe( 'requests reducer', () => {
	it( 'state should default to initialRequestsState', () => {
		const stateOut = requestsReducer( undefined, {} );

		expect( stateOut ).to.equal( initialRequestsState );
	} );

	describe( '#trackingSettingsFetch', () => {
		it( 'should set fetchingTrackingSettings to true when fetching', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH'
			};
			let stateOut = requestsReducer( stateIn, action );

			expect( stateOut.fetchingTrackingSettings ).to.be.true;
		} );

		it( 'should set fetchingTrackingSettings to false when updated', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );

			expect( stateOut.fetchingTrackingSettings ).to.be.false;
		} );

		it( 'should set fetchingTrackingSettings to false when updating failed', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_FETCH_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );

			expect( stateOut.fetchingTrackingSettings ).to.be.false;
		} );
	} );

	describe( '#trackingSettingsUpdate', () => {
		it( 'should set updatingTrackingSettings to true when updating', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE',
				updatedSettings: { tracks_opt_out: true },
			};
			let stateOut = requestsReducer( stateIn, action );

			expect( stateOut.updatingTrackingSettings ).to.be.true;
		} );

		it( 'should set updatingTrackingSettings to false when updated', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE_SUCCESS',
				updatedSettings: { tracks_opt_out: true },
			};
			let stateOut = requestsReducer( stateIn, action );

			expect( stateOut.updatingTrackingSettings ).to.be.false;
		} );

		it( 'should set updatingTrackingSettings to false when updating failed', () => {
			const stateIn = {};
			const action = {
				type: 'USER_TRACKING_SETTINGS_UPDATE_FAIL',
				updatedSettings: { tracks_opt_out: true },
			};
			let stateOut = requestsReducer( stateIn, action );

			expect( stateOut.updatingTrackingSettings ).to.be.false;
		} );
	} );
} );
