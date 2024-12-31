/* global pluploadL10n, plupload, wpUploaderInit, wpQueueError, setResize, setUserSetting, deleteUserSetting, getUserSetting, uploadStart, uploadProgress, uploadError, uploadSuccess, uploadComplete, fileQueued, fileUploading, error */

window.wp = window.wp || {};

( function ( exports, $ ) {
	var vp;

	if ( typeof wpUploaderInit === 'undefined' ) {
		return;
	}

	// Init and set the uploader.
	var uploader_init = function () {
		// Make sure that the VideoPress object is available
		if ( typeof exports.VideoPress !== 'undefined' ) {
			vp = exports.VideoPress;
		}

		var uploader = new plupload.Uploader( wpUploaderInit );

		$( '#image_resize' ).on( 'change', function () {
			var arg = $( this ).prop( 'checked' );

			setResize( arg );

			if ( arg ) setUserSetting( 'upload_resize', '1' );
			else deleteUserSetting( 'upload_resize' );
		} );

		uploader.bind( 'Init', function ( up ) {
			var uploaddiv = $( '#plupload-upload-ui' );

			setResize( getUserSetting( 'upload_resize', false ) );

			if ( up.features.dragdrop && ! $( document.body ).hasClass( 'mobile' ) ) {
				uploaddiv.addClass( 'drag-drop' );

				$( '#drag-drop-area' )
					.on( 'dragover.wp-uploader', function () {
						// dragenter doesn't fire right :(
						uploaddiv.addClass( 'drag-over' );
					} )
					.on( 'dragleave.wp-uploader, drop.wp-uploader', function () {
						uploaddiv.removeClass( 'drag-over' );
					} );
			} else {
				uploaddiv.removeClass( 'drag-drop' );
				$( '#drag-drop-area' ).off( '.wp-uploader' );
			}

			if ( up.runtime === 'html4' ) {
				$( '.upload-flash-bypass' ).hide();
			}
		} );

		uploader.bind( 'postinit', function ( up ) {
			up.refresh();
		} );

		uploader.init();

		uploader.bind( 'FilesAdded', function ( up, files ) {
			$( '#media-upload-error' ).empty();
			uploadStart();

			plupload.each( files, function ( file ) {
				if ( file.type === 'image/heic' && up.settings.heic_upload_error ) {
					// Show error but do not block uploading.
					wpQueueError( pluploadL10n.unsupported_image );
				} else if ( file.type === 'image/webp' && up.settings.webp_upload_error ) {
					// Disallow uploading of WebP images if the server cannot edit them.
					wpQueueError( pluploadL10n.noneditable_image );
					up.removeFile( file );
					return;
				} else if ( file.type === 'image/avif' && up.settings.avif_upload_error ) {
					// Disallow uploading of AVIF images if the server cannot edit them.
					wpQueueError( pluploadL10n.noneditable_image );
					up.removeFile( file );
					return;
				}

				fileQueued( file );
			} );

			up.refresh();
			up.start();
		} );

		uploader.bind( 'UploadFile', function ( up, file ) {
			fileUploading( up, file );
		} );

		uploader.bind( 'UploadProgress', function ( up, file ) {
			uploadProgress( up, file );
		} );

		uploader.bind( 'Error', function ( up, error ) {
			vp && vp.resetToOriginalOptions( up );

			uploadError( error.file, error.code, error.message, up );
			up.refresh();
		} );

		uploader.bind( 'FileUploaded', function ( up, file, response ) {
			var mediaID;
			if ( typeof file.videopress !== 'undefined' ) {
				try {
					response = JSON.parse( response.response );
					mediaID = response.media[ 0 ].ID;
				} catch ( e ) {
					return error( pluploadL10n.default_error, e, file );
				}
			} else {
				mediaID = response.response;
			}

			vp && vp.resetToOriginalOptions( up );

			uploadSuccess( file, mediaID );
		} );

		uploader.bind( 'UploadComplete', function ( up ) {
			vp && vp.resetToOriginalOptions( up );

			uploadComplete();
		} );

		/**
		 * Before we upload, check to see if this file is a videopress upload, if so, set new options and save the old ones.
		 */
		uploader.bind( 'BeforeUpload', function ( up, file ) {
			if ( typeof file.videopress !== 'undefined' ) {
				vp && vp.overrideOriginalOptions( up, file );
			}
		} );
	};

	uploader_init();

	// Avoid triggering the default uploader_init function.
	wpUploaderInit = undefined; // eslint-disable-line no-global-assign
} )( wp, jQuery );
