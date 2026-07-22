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

	// Video files in the selection currently being added to the uploader,
	// recorded before the file filters run so the free-plan gate can block a
	// multi-video selection before any upload starts.
	var pendingBatchVideoCount = 0;

	/**
	 * Counts the video files in an addFile() argument.
	 *
	 * @param {Array|FileList|object} file What was passed to addFile: a single
	 *                                     file or an array-like of files.
	 * @return {number} How many of them are videos.
	 */
	function countVideoFiles( file ) {
		var files = file && typeof file.length === 'number' ? file : [ file ];
		var count = 0;

		for ( var i = 0; i < files.length; i++ ) {
			var type = files[ i ] && files[ i ].type;

			if ( type && type.split( '/' )[ 0 ] === 'video' ) {
				count++;
			}
		}

		return count;
	}

	/**
	 * Returns the upload limit data localized by the module.
	 *
	 * @return {object} The limit data.
	 */
	function getUploadLimits() {
		return typeof videoPressMediaNew !== 'undefined' ? videoPressMediaNew : {};
	}

	// Class of the container the upgrade notice renders in.
	var NOTICE_CLASS = 'videopress-media-new-notice';

	/**
	 * Removes any previously rendered upgrade notice.
	 */
	function removeUpgradeNotice() {
		var notices = document.querySelectorAll( '.' + NOTICE_CLASS );

		for ( var i = 0; i < notices.length; i++ ) {
			notices[ i ].parentNode.removeChild( notices[ i ] );
		}
	}

	/**
	 * Shows the free-plan upgrade notice above the upload queue.
	 *
	 * The message is pre-escaped HTML built server-side, containing the link
	 * to the upgrade path. It renders in a container of its own next to the
	 * stock #media-upload-error area rather than inside it: the stock
	 * FilesAdded handler empties #media-upload-error as soon as any file of
	 * the selection is accepted, which would wipe a notice rendered there
	 * before the user could read it.
	 *
	 * @param {string} message The notice HTML.
	 */
	function showUpgradeNotice( message ) {
		if ( ! message ) {
			return;
		}

		var anchor = document.getElementById( 'media-upload-error' );

		if ( ! anchor || ! anchor.parentNode ) {
			// The stock error area is better than no notice at all.
			if ( typeof wpQueueError === 'function' ) {
				wpQueueError( message );
			}
			return;
		}

		removeUpgradeNotice();

		var notice = document.createElement( 'div' );
		notice.className = 'notice notice-warning ' + NOTICE_CLASS;

		var paragraph = document.createElement( 'p' );
		// The message is localized server-side and passed through wp_kses;
		// it only contains the upgrade link markup.
		paragraph.innerHTML = message;

		notice.appendChild( paragraph );
		anchor.parentNode.insertBefore( notice, anchor.nextSibling );
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

		// A selection with more than one video is blocked entirely — including
		// its first video — so no upload starts until the user upgrades.
		if ( pendingBatchVideoCount > 1 ) {
			showUpgradeNotice( strings.multipleVideosSelected );
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
		 * Record how many videos each selection contains before plupload runs
		 * the file filters, so the free-plan gate can reject every video of a
		 * multi-video selection. Both the file selector and drag-and-drop
		 * funnel their whole selection through a single addFile() call.
		 */
		var stockAddFile = uploader.addFile;

		uploader.addFile = function ( file, fileName ) {
			// Each selection starts clean: a notice about a previous
			// selection no longer applies to this one.
			removeUpgradeNotice();
			pendingBatchVideoCount = countVideoFiles( file );
			return stockAddFile.call( this, file, fileName );
		};

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
