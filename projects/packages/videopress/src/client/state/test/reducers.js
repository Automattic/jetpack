import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS,
	SET_VIDEOS_QUERY,
	SET_VIDEOS_PAGINATION,
	SET_VIDEO,
	SET_VIDEOS_STORAGE_USED,
	SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
	SET_UPLOADED_VIDEO_COUNT,
	REMOVE_VIDEO,
	DELETE_VIDEO,
	FLUSH_DELETED_VIDEOS,
	SET_USERS,
	SET_USERS_PAGINATION,
	SET_IS_FETCHING_PLAYBACK_TOKEN,
	SET_PLAYBACK_TOKEN,
	EXPIRE_PLAYBACK_TOKEN,
	SET_VIDEOPRESS_SETTINGS,
	SET_LOCAL_VIDEOS,
	SET_IS_FETCHING_LOCAL_VIDEOS,
} from '../constants';
import reducers from '../reducers';

describe( 'videos reducer', () => {
	it( 'should handle SET_IS_FETCHING_VIDEOS', () => {
		const state = reducers( undefined, {
			type: SET_IS_FETCHING_VIDEOS,
			isFetching: true,
		} );
		expect( state.videos.isFetching ).toBe( true );
	} );

	it( 'should handle SET_VIDEOS_FETCH_ERROR', () => {
		const state = reducers( undefined, {
			type: SET_VIDEOS_FETCH_ERROR,
			error: 'Network error',
		} );
		expect( state.videos.error ).toBe( 'Network error' );
		expect( state.videos.isFetching ).toBe( false );
	} );

	it( 'should handle SET_VIDEOS_QUERY', () => {
		const initialState = {
			videos: { query: { page: 1 }, _meta: {} },
		};
		const state = reducers( initialState, {
			type: SET_VIDEOS_QUERY,
			query: { page: 2, search: 'test' },
		} );
		expect( state.videos.query ).toEqual( expect.objectContaining( { page: 2, search: 'test' } ) );
		expect( state.videos._meta.relyOnInitialState ).toBe( false );
	} );

	it( 'should handle SET_VIDEOS_PAGINATION', () => {
		const initialState = {
			videos: { pagination: {}, _meta: {} },
		};
		const state = reducers( initialState, {
			type: SET_VIDEOS_PAGINATION,
			pagination: { total: 50, totalPages: 5 },
		} );
		expect( state.videos.pagination ).toEqual(
			expect.objectContaining( { total: 50, totalPages: 5 } )
		);
	} );

	it( 'should handle SET_VIDEOS', () => {
		const videos = [ { id: 1, title: 'Video 1' } ];
		const state = reducers( undefined, {
			type: SET_VIDEOS,
			videos,
		} );
		expect( state.videos.items ).toEqual( videos );
		expect( state.videos.isFetching ).toBe( false );
	} );

	it( 'should handle SET_VIDEO adding a new video at the beginning', () => {
		const initialState = {
			videos: { items: [ { id: 1, title: 'Existing' } ] },
		};
		const state = reducers( initialState, {
			type: SET_VIDEO,
			video: { id: 2, title: 'New' },
		} );
		expect( state.videos.items ).toHaveLength( 2 );
		expect( state.videos.items[ 0 ].id ).toBe( 2 );
	} );

	it( 'should handle SET_VIDEO updating an existing video', () => {
		const initialState = {
			videos: { items: [ { id: 1, title: 'Old' } ] },
		};
		const state = reducers( initialState, {
			type: SET_VIDEO,
			video: { id: 1, title: 'Updated' },
		} );
		expect( state.videos.items ).toHaveLength( 1 );
		expect( state.videos.items[ 0 ].title ).toBe( 'Updated' );
	} );

	it( 'should handle SET_VIDEOS_STORAGE_USED', () => {
		const state = reducers( undefined, {
			type: SET_VIDEOS_STORAGE_USED,
			used: 1024,
		} );
		expect( state.videos.storageUsed ).toBe( 1024 );
	} );

	it( 'should handle SET_IS_FETCHING_UPLOADED_VIDEO_COUNT', () => {
		const state = reducers( undefined, {
			type: SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
			isFetchingUploadedVideoCount: true,
		} );
		expect( state.videos.isFetchingUploadedVideoCount ).toBe( true );
	} );

	it( 'should handle SET_UPLOADED_VIDEO_COUNT', () => {
		const state = reducers( undefined, {
			type: SET_UPLOADED_VIDEO_COUNT,
			uploadedVideoCount: 42,
		} );
		expect( state.videos.uploadedVideoCount ).toBe( 42 );
		expect( state.videos.isFetchingUploadedVideoCount ).toBe( false );
	} );

	it( 'should handle REMOVE_VIDEO', () => {
		const initialState = {
			videos: {
				items: [ { id: 1, title: 'Video' } ],
				_meta: {},
			},
		};
		const state = reducers( initialState, {
			type: REMOVE_VIDEO,
			id: 1,
		} );
		expect( state.videos._meta.videosBeingRemoved ).toEqual( [
			{ id: 1, processed: false, deleted: false },
		] );
		expect( state.videos._meta.items[ 1 ].isDeleting ).toBe( true );
	} );

	it( 'should handle DELETE_VIDEO', () => {
		const initialState = {
			videos: {
				items: [ { id: 1, title: 'Video' } ],
				_meta: {
					videosBeingRemoved: [ { id: 1, processed: false, deleted: false } ],
					items: { 1: { isDeleting: true } },
				},
			},
		};
		const state = reducers( initialState, {
			type: DELETE_VIDEO,
			id: 1,
			hasBeenDeleted: true,
			video: { id: 1 },
		} );
		expect( state.videos._meta.processedAllVideosBeingRemoved ).toBe( true );
		expect( state.videos._meta.items[ 1 ].hasBeenDeleted ).toBe( true );
	} );

	it( 'should handle FLUSH_DELETED_VIDEOS', () => {
		const initialState = {
			videos: {
				_meta: {
					videosBeingRemoved: [ { id: 1, processed: true, deleted: true } ],
				},
			},
		};
		const state = reducers( initialState, {
			type: FLUSH_DELETED_VIDEOS,
		} );
		expect( state.videos._meta.videosBeingRemoved ).toEqual( [] );
		expect( state.videos._meta.relyOnInitialState ).toBe( false );
	} );
} );

describe( 'localVideos reducer', () => {
	it( 'should handle SET_LOCAL_VIDEOS', () => {
		const videos = [ { id: 1, title: 'Local Video' } ];
		const state = reducers( undefined, {
			type: SET_LOCAL_VIDEOS,
			videos,
		} );
		expect( state.localVideos.items ).toEqual( videos );
		expect( state.localVideos.isFetching ).toBe( false );
	} );

	it( 'should handle SET_IS_FETCHING_LOCAL_VIDEOS', () => {
		const state = reducers( undefined, {
			type: SET_IS_FETCHING_LOCAL_VIDEOS,
			isFetching: true,
		} );
		expect( state.localVideos.isFetching ).toBe( true );
	} );
} );

describe( 'users reducer', () => {
	it( 'should handle SET_USERS', () => {
		const users = [ { id: 1, name: 'User 1' } ];
		const state = reducers( undefined, {
			type: SET_USERS,
			users,
		} );
		expect( state.users.items ).toEqual( users );
	} );

	it( 'should handle SET_USERS_PAGINATION', () => {
		const state = reducers( undefined, {
			type: SET_USERS_PAGINATION,
			pagination: { total: 10, totalPages: 2 },
		} );
		expect( state.users.pagination ).toEqual(
			expect.objectContaining( { total: 10, totalPages: 2 } )
		);
	} );
} );

describe( 'playbackTokens reducer', () => {
	it( 'should handle SET_IS_FETCHING_PLAYBACK_TOKEN', () => {
		const state = reducers( undefined, {
			type: SET_IS_FETCHING_PLAYBACK_TOKEN,
			isFetching: true,
		} );
		expect( state.playbackTokens.isFetching ).toBe( true );
	} );

	it( 'should handle SET_PLAYBACK_TOKEN adding a new token', () => {
		const initialState = {
			playbackTokens: { items: [] },
		};
		const state = reducers( initialState, {
			type: SET_PLAYBACK_TOKEN,
			playbackToken: { guid: 'abc123', token: 'tok_1' },
		} );
		expect( state.playbackTokens.items ).toHaveLength( 1 );
		expect( state.playbackTokens.items[ 0 ].guid ).toBe( 'abc123' );
		expect( state.playbackTokens.isFetching ).toBe( false );
	} );

	it( 'should handle EXPIRE_PLAYBACK_TOKEN', () => {
		const initialState = {
			playbackTokens: {
				items: [ { guid: 'abc123', token: 'tok_1' } ],
			},
		};
		const state = reducers( initialState, {
			type: EXPIRE_PLAYBACK_TOKEN,
			guid: 'abc123',
		} );
		expect( state.playbackTokens.items ).toHaveLength( 0 );
	} );
} );

describe( 'siteSettings reducer', () => {
	it( 'should handle SET_VIDEOPRESS_SETTINGS', () => {
		const state = reducers( undefined, {
			type: SET_VIDEOPRESS_SETTINGS,
			videoPressSettings: { allowDownload: true },
		} );
		expect( state.siteSettings.allowDownload ).toBe( true );
	} );
} );
