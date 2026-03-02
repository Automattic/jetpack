/* global jQuery, wp */
( function ( $, wp ) {
	/**
	 * Checks whether a Backbone attachment model is a processing VideoPress video.
	 *
	 * @param {object} attachment - Backbone attachment model.
	 * @return {boolean} True when the video is still processing.
	 */
	function isProcessingVideo( attachment ) {
		return (
			attachment.get( 'type' ) === 'video' &&
			attachment.get( 'subtype' ) === 'videopress' &&
			attachment.get( 'videopress_status' ) &&
			attachment.get( 'videopress_status' ) !== 'complete'
		);
	}

	/**
	 * Returns attachment IDs for VideoPress videos that are still processing.
	 *
	 * @return {Array} Attachment IDs.
	 */
	function getProcessingVideoIds() {
		if ( ! wp.media.frame || ! wp.media.frame.state() ) {
			return [];
		}

		const library = wp.media.frame.state().get( 'library' );
		if ( ! library ) {
			return [];
		}

		const ids = [];
		library.each( function ( attachment ) {
			if ( isProcessingVideo( attachment ) ) {
				ids.push( attachment.get( 'id' ) );
			}
		} );
		return ids;
	}

	$( document ).on( 'heartbeat-send', function ( e, data ) {
		const ids = getProcessingVideoIds();
		if ( ids.length ) {
			data.videopress_processing_ids = ids;
			wp.heartbeat.interval( 'fast' );
		} else {
			wp.heartbeat.interval( 'standard' );
		}
	} );

	// Speed up heartbeat when a video upload completes so processing status
	// is detected quickly. The heartbeat-send handler reverts to 'standard'
	// once no processing videos remain.
	const bootCheck = setInterval( function () {
		if ( ! wp.media.frame || ! wp.media.frame.state() ) {
			return;
		}
		clearInterval( bootCheck );

		const library = wp.media.frame.state().get( 'library' );
		if ( ! library ) {
			return;
		}

		library.on( 'add', function ( attachment ) {
			if ( attachment.get( 'type' ) === 'video' ) {
				wp.heartbeat.interval( 'fast' );
			}
		} );

		if ( getProcessingVideoIds().length ) {
			wp.heartbeat.interval( 'fast' );
		}
	}, 500 );

	$( document ).on( 'heartbeat-tick', function ( e, data ) {
		if ( ! data.videopress_processing_status ) {
			return;
		}

		if ( ! wp.media.frame || ! wp.media.frame.state() ) {
			return;
		}

		const library = wp.media.frame.state().get( 'library' );
		if ( ! library ) {
			return;
		}

		$.each( data.videopress_processing_status, function ( id, status ) {
			const attachment = library.get( id );
			if ( attachment && status === 'complete' ) {
				wp.ajax
					.send( 'get-attachment', {
						data: { id: id },
					} )
					.done( function ( attrs ) {
						attachment.set( attrs );
					} );
			}
		} );
	} );
} )( jQuery, wp );
