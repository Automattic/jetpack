import { getProcessedAllVideosBeingRemoved, getFeatures, isFetchingFeatures } from '../selectors';

describe( 'getProcessedAllVideosBeingRemoved()', () => {
	it( 'should return true when videos finished being removed', () => {
		const state = {
			videos: {
				_meta: {
					processedAllVideosBeingRemoved: true,
				},
			},
		};
		const output = getProcessedAllVideosBeingRemoved( state );
		expect( output ).toBe( true );
	} );

	it( 'should return false when there is no indication of videos having been removed yet', () => {
		const state = {
			videos: {
				_meta: {},
			},
		};
		const output = getProcessedAllVideosBeingRemoved( state );
		// This would return undefined, which is falsy.
		expect( output ).toBeFalsy();
	} );
} );

describe( 'getFeatures()', () => {
	it( 'should return undefined when features have not been loaded', () => {
		const state = {};
		expect( getFeatures( state ) ).toBeUndefined();
	} );

	it( 'should return undefined when features object exists but isVideoPressSupported is undefined', () => {
		const state = {
			features: {
				isFetching: false,
			},
		};
		expect( getFeatures( state ) ).toBeUndefined();
	} );

	it( 'should return features object when loaded', () => {
		const state = {
			features: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			},
		};
		expect( getFeatures( state ) ).toEqual( {
			isVideoPressSupported: true,
			isVideoPress1TBSupported: true,
			isVideoPressUnlimitedSupported: false,
		} );
	} );

	it( 'should default missing feature flags to false', () => {
		const state = {
			features: {
				isVideoPressSupported: true,
				// Other flags are missing
			},
		};
		expect( getFeatures( state ) ).toEqual( {
			isVideoPressSupported: true,
			isVideoPress1TBSupported: false,
			isVideoPressUnlimitedSupported: false,
		} );
	} );
} );

describe( 'isFetchingFeatures()', () => {
	it( 'should return undefined when features state does not exist', () => {
		const state = {};
		expect( isFetchingFeatures( state ) ).toBeUndefined();
	} );

	it( 'should return true when fetching', () => {
		const state = {
			features: {
				isFetching: true,
			},
		};
		expect( isFetchingFeatures( state ) ).toBe( true );
	} );

	it( 'should return false when not fetching', () => {
		const state = {
			features: {
				isFetching: false,
			},
		};
		expect( isFetchingFeatures( state ) ).toBe( false );
	} );
} );
