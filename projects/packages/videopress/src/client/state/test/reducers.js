import { SET_FEATURES, SET_IS_FETCHING_FEATURES } from '../constants';
import reducers from '../reducers';

describe( 'features reducer', () => {
	it( 'should return initial state with undefined features', () => {
		const state = reducers( undefined, { type: 'UNKNOWN_ACTION' } );
		expect( state.features ).toBeUndefined();
	} );

	it( 'should handle SET_IS_FETCHING_FEATURES', () => {
		const state = reducers( undefined, {
			type: SET_IS_FETCHING_FEATURES,
			isFetching: true,
		} );
		expect( state.features ).toEqual( {
			isFetching: true,
		} );
	} );

	it( 'should handle SET_IS_FETCHING_FEATURES toggling off', () => {
		const initialState = {
			features: { isFetching: true },
		};
		const state = reducers( initialState, {
			type: SET_IS_FETCHING_FEATURES,
			isFetching: false,
		} );
		expect( state.features ).toEqual( {
			isFetching: false,
		} );
	} );

	it( 'should handle SET_FEATURES', () => {
		const initialState = {
			features: { isFetching: true },
		};
		const state = reducers( initialState, {
			type: SET_FEATURES,
			features: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			},
		} );
		expect( state.features ).toEqual( {
			isFetching: false, // Should be set to false when features arrive
			isVideoPressSupported: true,
			isVideoPress1TBSupported: true,
			isVideoPressUnlimitedSupported: false,
		} );
	} );

	it( 'should preserve existing features state when setting new features', () => {
		const initialState = {
			features: {
				isFetching: true,
				someOtherProp: 'value',
			},
		};
		const state = reducers( initialState, {
			type: SET_FEATURES,
			features: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			},
		} );
		expect( state.features ).toEqual( {
			isFetching: false,
			someOtherProp: 'value',
			isVideoPressSupported: true,
			isVideoPress1TBSupported: false,
			isVideoPressUnlimitedSupported: false,
		} );
	} );
} );
