/* global plupload, pluploadL10n, ajaxurl, wpUploaderInit, uploadSuccess, wpFileError, wpQueueError, videoPressMediaNew */

/**
 * Routes video uploads from wp-admin/media-new.php to VideoPress.
 *
 * The classic uploader (plupload-handlers) creates a raw plupload.Uploader
 * rather than wp.Uploader, so the override in videopress-plupload.js never
 * engages there. This shim registers the same videopress_check_uploads file
 * filter and re-targets video uploads to VideoPress, then hands the local
 * attachment ID created during the upload back to the stock uploadSuccess
 * handler so the classic UI renders the media item as usual.
 */
( function ( $ ) {
	if ( typeof plupload === 'undefined' ) {
		return;
	}

	var originalOptions = {};

	// Videos accepted for VideoPress upload since the page loaded, used to
	// enforce the free plan's single-video limit within an upload session.
	var acceptedVideoCount = 0;

	/**
	 * Returns the upload limit data localized by the module.
	 *
	 * @return {object} The limit data.
	 */
	function getUploadLimits() {
		return typeof videoPressMediaNew !== 'undefined' ? videoPressMediaNew : {};
	}

	/**
	 * Shows the free-plan upgrade notice above the upload queue.
	 *
	 * The message is pre-escaped HTML built server-side, containing the link
	 * to the upgrade path. wpQueueError renders it inside the stock
	 * media-upload-error notice, like other queue-level upload errors.
	 *
	 * @param {string} message The notice HTML.
	 */
	function showUpgradeNotice( message ) {
		if ( typeof wpQueueError === 'function' && message ) {
			wpQueueError( message );
		}
	}

	/**
	 * Free-plan gate for a video file: the free plan includes a single video
	 * upload, so reject every video once the site already has a VideoPress
	 * video, and allow only one video per upload session otherwise.
	 *
	 * @param {plupload.File} file The video file being queued.
	 * @param {Function}      cb   The file filter continuation callback.
	 * @return {boolean} Whether the file was rejected.
	 */
	function rejectedByFreePlanLimits( file, cb ) {
		var limits = getUploadLimits();
		var strings = limits.strings || {};

		if ( limits.hasVideoPressPurchase ) {
			return false;
		}

		if ( limits.hasUsedVideo ) {
			showUpgradeNotice( strings.usedVideoUpload );
			cb( false );
			return true;
		}

		if ( acceptedVideoCount >= 1 ) {
			showUpgradeNotice( strings.multipleVideos );
			cb( false );
			return true;
		}

		return false;
	}

	/**
	 * Restores the stock upload settings saved before a VideoPress upload.
	 *
	 * @param {plupload.Uploader} up Uploader instance.
	 */
	function restoreOriginalOptions( up ) {
		if ( typeof originalOptions.url === 'undefined' ) {
			return;
		}

		up.setOption( 'url', originalOptions.url );
		up.setOption( 'file_data_name', originalOptions.file_data_name );
		up.setOption( 'headers', originalOptions.headers );

		originalOptions = {};
	}

	/**
	 * For video files, fetch a VideoPress upload token and attach it to the
	 * file before it is queued. Mirrors the videopress_check_uploads filter in
	 * videopress-uploader.js without depending on wp.media, which is not
	 * loaded on media-new.php. Non-video files get the stock max_file_size
	 * behavior this filter replaces.
	 */
	plupload.addFileFilter( 'videopress_check_uploads', function ( maxSize, file, cb ) {
		var self = this;

		/**
		 * Rejects the file with an uploader error.
		 *
		 * @param {string} [message] Error message to display.
		 */
		function fail( message ) {
			self.trigger( 'Error', {
				code: plupload.HTTP_ERROR,
				message:
					message ||
					plupload.translate( 'Could not get the VideoPress token needed for uploading' ),
				file: file,
			} );
			cb( false );
		}

		if ( file.type && file.type.split( '/' )[ 0 ] === 'video' ) {
			if ( rejectedByFreePlanLimits( file, cb ) ) {
				return;
			}

			$.post( ajaxurl, { action: 'videopress-get-upload-token', filename: file.name } )
				.done( function ( response ) {
					if (
						! response ||
						! response.success ||
						! response.data ||
						! response.data.upload_action_url
					) {
						fail( response && response.data && response.data.message );
						return;
					}

					file.videopress = response.data;
					acceptedVideoCount++;
					cb( true );
				} )
				.fail( function () {
					fail();
				} );

			return;
		}

		// Handles the stock max_file_size functionality for non-video files.
		if (
			typeof file.size !== 'undefined' &&
			maxSize &&
			file.size > plupload.parseSize( maxSize )
		) {
			this.trigger( 'Error', {
				code: plupload.FILE_SIZE_ERROR,
				message: pluploadL10n.file_exceeds_size_limit.replace( '%s', file.name ),
				file: file,
			} );
			cb( false );
			return;
		}

		cb( true );
	} );

	$( function () {
		// plupload-handlers is a dependency of this script, so its ready
		// callback ran first and the global `uploader` already exists.
		if (
			typeof wpUploaderInit === 'undefined' ||
			typeof window.uploader === 'undefined' ||
			! window.uploader
		) {
			return;
		}

		var uploader = window.uploader;

		/**
		 * Re-target VideoPress files right before each upload starts and
		 * restore the stock settings for everything else, so mixed batches
		 * of videos and other media both land in the right place.
		 */
		uploader.bind( 'BeforeUpload', function ( up, file ) {
			if ( typeof file.videopress === 'undefined' ) {
				restoreOriginalOptions( up );
				return;
			}

			if ( typeof originalOptions.url === 'undefined' ) {
				originalOptions.url = up.getOption( 'url' );
				originalOptions.file_data_name = up.getOption( 'file_data_name' );
				originalOptions.headers = up.getOption( 'headers' );
			}

			up.setOption( 'url', file.videopress.upload_action_url );
			up.setOption( 'file_data_name', 'media[]' );
			up.setOption( 'headers', {
				Authorization:
					'X_UPLOAD_TOKEN token="' +
					file.videopress.upload_token +
					'" blog_id="' +
					file.videopress.upload_blog_id +
					'"',
			} );
		} );

		uploader.bind( 'Error', function ( up ) {
			restoreOriginalOptions( up );
		} );

		uploader.bind( 'UploadComplete', function ( up ) {
			restoreOriginalOptions( up );
		} );

		/**
		 * The stock FileUploaded handler calls the global uploadSuccess with
		 * the raw server response, which for VideoPress uploads is the REST
		 * API media response instead of the attachment ID async-upload.php
		 * returns. Wrap uploadSuccess to translate the former into the
		 * latter; the stock handler then loads the media item row from
		 * async-upload.php as it would for any other upload.
		 */
		var stockUploadSuccess = uploadSuccess;

		window.uploadSuccess = function ( fileObj, serverData ) {
			if ( typeof fileObj.videopress === 'undefined' ) {
				return stockUploadSuccess( fileObj, serverData );
			}

			var response = null;

			try {
				response = JSON.parse( serverData );
			} catch {
				// Handled below.
			}

			var media = response && response.media && response.media[ 0 ];

			if ( ! media || ! media.ID ) {
				var message = response && ( response.message || response.error );
				wpFileError( fileObj, message || pluploadL10n.default_error );
				return;
			}

			return stockUploadSuccess( fileObj, String( media.ID ) );
		};
	} );
} )( jQuery );
