let handlers;
let mockLibrary;
let queueListeners;

/**
 * Creates a mock Backbone attachment model.
 *
 * @param {object} attrs - Attachment attributes.
 * @return {object} Mock attachment model.
 */
function createAttachment( attrs ) {
	return {
		get: key => attrs[ key ],
		set: jest.fn(),
	};
}

/**
 * Sets up the mock media library with the given attachments.
 *
 * @param {Array} attachments - Array of mock attachment models.
 */
function setupLibrary( attachments ) {
	mockLibrary = {
		each: jest.fn( cb => attachments.forEach( cb ) ),
		get: jest.fn( id => {
			// Backbone's collection.get coerces types; $.each object keys are strings.
			return attachments.find( a => String( a.get( 'id' ) ) === String( id ) ) || null;
		} ),
	};

	global.wp.media.frame = {
		state: () => ( {
			get: key => ( key === 'library' ? mockLibrary : null ),
		} ),
	};
}

beforeEach( () => {
	jest.resetModules();
	jest.useFakeTimers();

	handlers = {};
	queueListeners = {};

	// Mock jQuery: capture event handlers registered via $(document).on().
	const $ = jest.fn( () => ( {
		on: ( event, handler ) => {
			handlers[ event ] = handler;
		},
	} ) );
	$.each = ( obj, cb ) => {
		Object.keys( obj ).forEach( key => cb( key, obj[ key ] ) );
	};
	global.jQuery = $;

	// Mock wp global with Uploader queue.
	global.wp = {
		media: { frame: null },
		ajax: { send: jest.fn() },
		heartbeat: { interval: jest.fn(), connectNow: jest.fn() },
		Uploader: {
			queue: {
				on: jest.fn( ( event, cb ) => {
					queueListeners[ event ] = cb;
				} ),
			},
		},
	};
} );

afterEach( () => {
	jest.useRealTimers();
} );

/**
 * Loads the media-library-poll script, triggering the IIFE.
 */
function loadScript() {
	require( '../media-library-poll' );
}

describe( 'upload detection', () => {
	it( 'speeds up heartbeat and connects immediately on video upload', () => {
		loadScript();

		queueListeners.add( createAttachment( { file: { type: 'video/mp4' } } ) );

		expect( global.wp.heartbeat.interval ).toHaveBeenCalledWith( 'fast' );
		expect( global.wp.heartbeat.connectNow ).toHaveBeenCalled();
	} );

	it( 'ignores non-video uploads', () => {
		loadScript();

		queueListeners.add( createAttachment( { file: { type: 'image/jpeg' } } ) );

		expect( global.wp.heartbeat.interval ).not.toHaveBeenCalled();
		expect( global.wp.heartbeat.connectNow ).not.toHaveBeenCalled();
	} );

	it( 'sets fast heartbeat when processing videos exist at load', () => {
		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'processing',
			} ),
		] );
		loadScript();
		jest.advanceTimersByTime( 500 );

		expect( global.wp.heartbeat.interval ).toHaveBeenCalledWith( 'fast' );
	} );

	it( 'waits for media frame before checking', () => {
		loadScript();
		jest.advanceTimersByTime( 500 );
		expect( global.wp.heartbeat.interval ).not.toHaveBeenCalled();

		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'processing',
			} ),
		] );
		jest.advanceTimersByTime( 500 );

		expect( global.wp.heartbeat.interval ).toHaveBeenCalledWith( 'fast' );
	} );
} );

describe( 'heartbeat-send', () => {
	it( 'adds processing video IDs to heartbeat data', () => {
		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'processing',
			} ),
			createAttachment( {
				id: 20,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'complete',
			} ),
		] );
		loadScript();

		const data = {};
		handlers[ 'heartbeat-send' ]( {}, data );

		expect( data.videopress_processing_ids ).toEqual( [ 10 ] );
	} );

	it( 'does not add IDs when no videos are processing', () => {
		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'complete',
			} ),
		] );
		loadScript();

		const data = {};
		handlers[ 'heartbeat-send' ]( {}, data );

		expect( data.videopress_processing_ids ).toBeUndefined();
	} );

	it( 'skips non-videopress videos', () => {
		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'mp4',
				videopress_status: undefined,
			} ),
		] );
		loadScript();

		const data = {};
		handlers[ 'heartbeat-send' ]( {}, data );

		expect( data.videopress_processing_ids ).toBeUndefined();
	} );

	it( 'speeds up heartbeat when videos are processing', () => {
		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'processing',
			} ),
		] );
		loadScript();

		handlers[ 'heartbeat-send' ]( {}, {} );

		expect( global.wp.heartbeat.interval ).toHaveBeenCalledWith( 'fast' );
	} );

	it( 'restores standard heartbeat when no videos are processing', () => {
		setupLibrary( [
			createAttachment( {
				id: 10,
				type: 'video',
				subtype: 'videopress',
				videopress_status: 'complete',
			} ),
		] );
		loadScript();

		handlers[ 'heartbeat-send' ]( {}, {} );

		expect( global.wp.heartbeat.interval ).toHaveBeenCalledWith( 'standard' );
	} );

	it( 'handles missing media frame gracefully', () => {
		loadScript();

		const data = {};
		handlers[ 'heartbeat-send' ]( {}, data );

		expect( data.videopress_processing_ids ).toBeUndefined();
	} );
} );

describe( 'heartbeat-tick', () => {
	it( 'fetches attachment data when status becomes complete', () => {
		const attachment = createAttachment( {
			id: 10,
			type: 'video',
			subtype: 'videopress',
			videopress_status: 'processing',
		} );
		setupLibrary( [ attachment ] );

		const deferred = {
			done: jest.fn( cb => {
				cb( { id: 10, icon: 'new-icon.png' } );
				return deferred;
			} ),
		};
		global.wp.ajax.send.mockReturnValue( deferred );

		loadScript();

		handlers[ 'heartbeat-tick' ](
			{},
			{
				videopress_processing_status: { 10: 'complete' },
			}
		);

		expect( attachment.set ).toHaveBeenCalledWith( 'videopress_status', 'complete' );
		expect( global.wp.ajax.send ).toHaveBeenCalledWith( 'get-attachment', {
			data: { id: '10' },
		} );
		expect( attachment.set ).toHaveBeenCalledWith( { id: 10, icon: 'new-icon.png' } );
	} );

	it( 'does not fetch when status is still processing', () => {
		const attachment = createAttachment( {
			id: 10,
			type: 'video',
			subtype: 'videopress',
			videopress_status: 'processing',
		} );
		setupLibrary( [ attachment ] );

		loadScript();

		handlers[ 'heartbeat-tick' ](
			{},
			{
				videopress_processing_status: { 10: 'processing' },
			}
		);

		expect( global.wp.ajax.send ).not.toHaveBeenCalled();
	} );

	it( 'ignores response without processing status data', () => {
		loadScript();

		// Should not throw.
		handlers[ 'heartbeat-tick' ]( {}, {} );

		expect( global.wp.ajax.send ).not.toHaveBeenCalled();
	} );

	it( 'handles missing media frame gracefully on tick', () => {
		loadScript();

		// Should not throw even with status data but no frame.
		handlers[ 'heartbeat-tick' ](
			{},
			{
				videopress_processing_status: { 10: 'complete' },
			}
		);

		expect( global.wp.ajax.send ).not.toHaveBeenCalled();
	} );
} );
