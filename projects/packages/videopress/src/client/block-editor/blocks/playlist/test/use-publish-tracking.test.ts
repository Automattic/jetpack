import jetpackAnalytics from '@automattic/jetpack-analytics';
import { act, renderHook } from '@testing-library/react';
import { createElement, StrictMode } from '@wordpress/element';
import usePublishTracking from '../use-publish-tracking';

const mockListeners = new Set< () => void >();
let mockState = {
	saving: false,
	publishing: false,
	autosave: false,
	preview: false,
	succeeded: true,
	postId: 123,
	postType: 'post',
	status: 'draft',
};
let mockBlocks: Record< string, string[] >;

const mockRegistry = {
	select: ( store: string ) =>
		store === 'core/editor'
			? {
					isSavingPost: () => mockState.saving,
					isPublishingPost: () => mockState.publishing,
					isAutosavingPost: () => mockState.autosave,
					isPreviewingPost: () => mockState.preview,
					didPostSaveRequestSucceed: () => mockState.succeeded,
					getCurrentPostId: () => mockState.postId,
					getCurrentPostType: () => mockState.postType,
					getCurrentPostAttribute: () => mockState.status,
				}
			: { getBlocksByName: ( name: string ) => mockBlocks[ name ] },
	subscribe: ( listener: () => void ) => {
		mockListeners.add( listener );
		return () => mockListeners.delete( listener );
	},
};

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );
jest.mock( '@wordpress/data', () => ( { useRegistry: () => mockRegistry } ) );

const recordEventMock = jetpackAnalytics.tracks.recordEvent as jest.Mock;
const props = { clientId: 'playlist-1', layout: 'grid', videoCount: 2 };
const eventName = 'jetpack_videopress_playlist_block_published';

const update = ( changes: Partial< typeof mockState > ) => {
	Object.assign( mockState, changes );
	[ ...mockListeners ].forEach( listener => listener() );
};
const start = () => update( { saving: true, publishing: true } );
const finish = () =>
	update( { saving: false, publishing: false, succeeded: true, status: 'publish' } );

beforeEach( () => {
	jest.clearAllMocks();
	mockListeners.clear();
	mockState = {
		saving: false,
		publishing: false,
		autosave: false,
		preview: false,
		succeeded: true,
		postId: 123,
		postType: 'post',
		status: 'draft',
	};
	mockBlocks = { 'videopress/playlist': [ 'playlist-1', 'playlist-2' ] };
} );

describe( 'usePublishTracking', () => {
	it( 'waits for completion and records once per type across multiple blocks and StrictMode', () => {
		renderHook(
			() => {
				usePublishTracking( props );
				usePublishTracking( { ...props, clientId: 'playlist-2' } );
			},
			{ wrapper: ( { children } ) => createElement( StrictMode, null, children ) }
		);

		act( start );
		act( () => update( { status: 'publish', publishing: false } ) );
		expect( recordEventMock ).not.toHaveBeenCalled();

		act( finish );
		act( () => update( {} ) );
		expect( recordEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordEventMock ).toHaveBeenCalledWith( eventName, {
			post_type: 'post',
			layout: 'grid',
			video_count: 2,
			playlist_count: 2,
		} );
	} );

	it( 'observes a complete save between React renders', () => {
		renderHook( () => usePublishTracking( props ) );
		act( () => {
			start();
			finish();
		} );
		expect( recordEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not adopt stale success or a save already running when mounted', () => {
		const { unmount } = renderHook( () => usePublishTracking( props ) );
		act( () => update( { status: 'publish' } ) );
		expect( recordEventMock ).not.toHaveBeenCalled();
		unmount();

		start();
		renderHook( () => usePublishTracking( props ) );
		act( finish );
		expect( recordEventMock ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'failed request', { succeeded: false, status: 'draft' } ],
		[ 'pre-save failure with a stale success flag', { succeeded: true, status: 'draft' } ],
		[ 'scheduled response', { succeeded: true, status: 'future' } ],
		[ 'private response', { succeeded: true, status: 'private' } ],
	] )( 'does not count a %s, and allows a subsequent successful retry', ( _name, result ) => {
		renderHook( () => usePublishTracking( props ) );
		act( start );
		act( () => update( { saving: false, publishing: false, ...result } ) );
		expect( recordEventMock ).not.toHaveBeenCalled();
		act( () => {
			start();
			finish();
		} );
		expect( recordEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[ 'autosave', { publishing: true, autosave: true } ],
		[ 'preview', { publishing: true, preview: true } ],
		[ 'ordinary update', { publishing: false, status: 'publish' } ],
		[ 'draft save', { publishing: false, status: 'draft' } ],
	] )( 'excludes an %s even with an affirmative completion', ( _name, changes ) => {
		renderHook( () => usePublishTracking( props ) );
		act( () => update( { saving: true, ...changes } ) );
		act( finish );
		expect( recordEventMock ).not.toHaveBeenCalled();
	} );

	it( 'does not report when the first block cannot be established', () => {
		mockBlocks = {};
		renderHook( () => usePublishTracking( props ) );
		act( () => {
			start();
			finish();
		} );
		expect( recordEventMock ).not.toHaveBeenCalled();
	} );

	it( 'keeps the submitted snapshot through prop changes and reporter reordering', () => {
		const { rerender } = renderHook( usePublishTracking, { initialProps: props } );
		act( start );
		mockBlocks[ 'videopress/playlist' ] = [ 'playlist-2', 'playlist-1' ];
		rerender( { ...props, videoCount: 9, layout: 'strip' } );
		act( finish );
		expect( recordEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordEventMock ).toHaveBeenCalledWith( eventName, {
			post_type: 'post',
			layout: 'grid',
			video_count: 2,
			playlist_count: 2,
		} );
	} );

	it( 'finishes an observed save after unmount and then releases the subscription', () => {
		const { unmount } = renderHook( () => usePublishTracking( props ) );
		act( start );
		unmount();
		act( finish );
		expect( recordEventMock ).toHaveBeenCalledTimes( 1 );
		expect( mockListeners.size ).toBe( 0 );
	} );

	it.each( [ { postId: 456 }, { postType: 'page' } ] )(
		'discards a pending publication when the editor switches post context: %o',
		changes => {
			const { unmount } = renderHook( () => usePublishTracking( props ) );
			act( start );
			unmount();
			act( () => update( changes ) );
			act( finish );
			expect( recordEventMock ).not.toHaveBeenCalled();
			expect( mockListeners.size ).toBe( 0 );
		}
	);

	it( 'releases an idle subscription on unmount', () => {
		const { unmount } = renderHook( () => usePublishTracking( props ) );
		unmount();
		expect( mockListeners.size ).toBe( 0 );
	} );

	it( 'keeps the latest-videos event independent of the manual playlist event', () => {
		mockBlocks[ 'videopress/latest-videos-playlist' ] = [ 'latest-1' ];
		renderHook( () => {
			usePublishTracking( props );
			usePublishTracking( {
				...props,
				clientId: 'latest-1',
				videoCount: 4,
				blockName: 'videopress/latest-videos-playlist',
				eventName: 'jetpack_videopress_latest_videos_playlist_block_published',
			} );
		} );
		act( () => {
			start();
			finish();
		} );
		expect( recordEventMock ).toHaveBeenCalledTimes( 2 );
		expect( recordEventMock ).toHaveBeenCalledWith(
			'jetpack_videopress_latest_videos_playlist_block_published',
			{ post_type: 'post', layout: 'grid', video_count: 4, playlist_count: 1 }
		);
	} );
} );
