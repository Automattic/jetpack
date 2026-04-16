import { DELETE_VIDEO, REMOVE_VIDEO, SET_FEATURES, SET_IS_FETCHING_FEATURES } from '../constants';
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

describe( 'videos reducer - delete flow', () => {
	const videoId = 1383;

	const stateWithVideoMarkedForRemoval = () =>
		reducers(
			{
				videos: {
					items: [ { id: videoId, title: 'post-editor-mov' } ],
					uploadedVideoCount: 1,
					_meta: { processedAllVideosBeingRemoved: true, relyOnInitialState: true },
				},
			},
			{ type: REMOVE_VIDEO, id: videoId }
		);

	it( 'REMOVE_VIDEO sets isDeleting on the video metadata', () => {
		const state = stateWithVideoMarkedForRemoval();
		expect( state.videos._meta.items[ videoId ].isDeleting ).toBe( true );
		expect( state.videos._meta.videosBeingRemoved ).toEqual( [
			{ id: videoId, processed: false, deleted: false },
		] );
	} );

	it( 'DELETE_VIDEO clears isDeleting when the server confirms the delete', () => {
		const afterRemove = stateWithVideoMarkedForRemoval();
		const afterDelete = reducers( afterRemove, {
			type: DELETE_VIDEO,
			id: videoId,
			hasBeenDeleted: true,
			video: { id: videoId, title: 'post-editor-mov' },
		} );

		expect( afterDelete.videos._meta.items[ videoId ].isDeleting ).toBe( false );
		expect( afterDelete.videos._meta.items[ videoId ].hasBeenDeleted ).toBe( true );
		expect( afterDelete.videos.uploadedVideoCount ).toBe( 0 );
	} );

	it( 'DELETE_VIDEO clears isDeleting even when the server delete failed', () => {
		// Regression guard: if the apiFetch DELETE fails or the response
		// does not include { deleted: true }, the thunk still dispatches
		// DELETE_VIDEO in its `finally` block with hasBeenDeleted=false.
		// Without clearing isDeleting here, the video row stays stuck in
		// a gray loading state forever and the user has no way to retry.
		const afterRemove = stateWithVideoMarkedForRemoval();
		const afterDelete = reducers( afterRemove, {
			type: DELETE_VIDEO,
			id: videoId,
			hasBeenDeleted: false,
			video: {},
		} );

		expect( afterDelete.videos._meta.items[ videoId ].isDeleting ).toBe( false );
		expect( afterDelete.videos._meta.items[ videoId ].hasBeenDeleted ).toBe( false );
		// Count is unchanged on failure.
		expect( afterDelete.videos.uploadedVideoCount ).toBe( 1 );
	} );
} );
