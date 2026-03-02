/* global jQuery, wp */
( function ( $, wp ) {
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
			if (
				attachment.get( 'type' ) === 'video' &&
				attachment.get( 'subtype' ) === 'videopress' &&
				attachment.get( 'videopress_status' ) &&
				attachment.get( 'videopress_status' ) !== 'complete'
			) {
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

	// Speed up heartbeat when a video is uploaded so processing status
	// is polled quickly. wp.Uploader.queue fires 'add' as soon as an
	// upload starts, with the file's MIME type available.
	if ( wp.Uploader ) {
		wp.Uploader.queue.on( 'add', function ( attachment ) {
			const file = attachment.get( 'file' );
			if ( file && /^video\//.test( file.type ) ) {
				wp.heartbeat.interval( 'fast' );
				wp.heartbeat.connectNow();
			}
		} );
	}

	// Also kick off fast polling if videos were already processing on
	// page load. The media frame isn't available immediately, so poll
	// until it is.
	const bootCheck = setInterval( function () {
		if ( ! wp.media.frame || ! wp.media.frame.state() ) {
			return;
		}
		clearInterval( bootCheck );

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
				// Prevent duplicate fetches on subsequent ticks.
				attachment.set( 'videopress_status', 'complete' );

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
