
window.wp = window.wp || {};

( function( wp, $ ) {
	if (typeof wp.Uploader !== 'undefined') {
		var Uploader = wp.Uploader;
		var media = wp.media;

		$.extend( Uploader.prototype, {
			/**
			 * Initialization routine that allows us to add in more uploader events.
			 */
			init: function () {
				var self = this;

				this.uploader.bind( 'BeforeUpload', function( up, file ) {
					if ( typeof file.videopress !== 'undefined' ) {
						self.origOptions = self.origOptions || {};
						self.origOptions.url = up.getOption( 'url' );
						self.origOptions.multipart_params = up.getOption( 'multipart_params' );

						up.setOption( 'url', file.videopress.videopress_action_url );
						up.setOption( 'multipart_params', {
							videopress_token: file.videopress.videopress_token,
							videopress_blog_id: file.videopress.videopress_blog_id
						});
					}
				});

				this.uploader.bind( 'UploadComplete', function( up, files ) {
					self.resetToOriginalOptions( up );
				});

				this.uploader.bind( 'Error', function( up, error ) {
					self.resetToOriginalOptions( up );
				});
			},

			/**
			 * Make sure that all of the original variables have been reset, so the uploader
			 * doesn't try to go to VideoPress again next time.
			 *
			 * @param up
			 */
			resetToOriginalOptions: function( up ) {
				if ( typeof this.origOptions.url !== 'undefined' ) {
					up.setOption( 'url', this.origOptions.url );
					delete this.origOptions.url;
				}

				if ( typeof this.origOptions.multipart_params !== 'undefined' ) {
					up.setOption( 'multipart_params', this.origOptions.multipart_params );
					delete this.origOptions.multipart_params;
				}
			}
		});

		/**
		 * A plupload code specifically for videopress failures.
		 *
		 * @type {string}
		 */
		plupload.VIDEOPRESS_TOKEN_FAILURE = 'VP_TOKEN_FAILURE';

		/**
		 * Adds a filter that checks all files to see if they are videopress files and if they are
		 * it will download extra metadata for them.
		 */
		plupload.addFileFilter( 'videopress_check_uploads', function( check, file, cb ) {
			var mimeParts = file.type.split('/');

			if ( mimeParts[0] === 'video' ) {
				media.ajax( 'videopress-get-upload-token', { async: false } ).done( function ( response ) {
					file.videopress = response;

				}).fail( function ( response ) {
					this.trigger( 'Error', {
						code : plupload.VIDEOPRESS_TOKEN_FAILURE,
						message : plupload.translate( 'Could not get the videopress token needed for uploading' ),
						file : file,
						response : response
					} );

					cb( false );
				});
			}

			cb( true );
		});
	}
} )( window.wp, jQuery );


