/* globals plupload, error, pluploadL10n, JSON */
window.wp = window.wp || {};

( function( wp, $ ) {
	if (typeof wp.Uploader !== 'undefined') {
		var Uploader = wp.Uploader,
			media = wp.media;

		$.extend( Uploader.prototype, {

			/**
			 * Custom error callback.
			 *
			 * Add a new error to the errors collection, so other modules can track
			 * and display errors. @see wp.Uploader.errors.
			 *
			 * @param  {string}        message
			 * @param  {object}        data
			 * @param  {plupload.File} file     File that was uploaded.
			 */
			error: function( message, data, file ) {
				if ( file.attachment ) {
					file.attachment.destroy();
				}

				var error_msg = {
					message: message || pluploadL10n.default_error,
					data:    data,
					file:    file
				};

				Uploader.errors.unshift( error_msg );
			},

			/**
			 * Initialization routine that allows us to add in more uploader events.
			 */
			init: function () {
				var self = this;
				self.origOptions = self.origOptions || {};

				this.uploader.bind( 'BeforeUpload', function( up, file ) {
					if ( typeof file.videopress !== 'undefined' ) {
						self.origOptions.url = up.getOption( 'url' );
						self.origOptions.multipart_params = up.getOption( 'multipart_params' );
						self.origOptions.file_data_name = up.getOption( 'file_data_name' );

						up.setOption( 'file_data_name', 'media[]' );
						up.setOption( 'url', file.videopress.upload_action_url );
						up.setOption( 'headers', {
							Authorization: 'X_UPLOAD_TOKEN token="' + file.videopress.upload_token + '" blog_id="' + file.videopress.upload_blog_id + '"'
						});
					}
				});

				this.uploader.bind( 'UploadComplete', function( up ) {
					self.resetToOriginalOptions( up );
				});

				this.uploader.bind( 'Error', function( up ) {
					self.resetToOriginalOptions( up );
				});

				// remove the normal file uploader check.
				this.uploader.unbind( 'FileUploaded' );

				/**
				 * After a file is successfully uploaded, update its model.
				 *
				 * @param {plupload.Uploader} uploader Uploader instance.
				 * @param {plupload.File}     file     File that was uploaded.
				 * @param {Object}            response Object with response properties.
				 * @return {mixed}
				 */
				this.uploader.bind( 'FileUploaded', function( up, file, response ) {
					var complete, id;

					try {
						response = JSON.parse( response.response );
					} catch ( e ) {
						return error( pluploadL10n.default_error, e, file );
					}

					if ( typeof response.media !== 'undefined' ) {
						id = self.handleRestApiResponse( response, file );
					} else {
						id = self.handleStandardResponse( response, file );
					}

					_.each(['file','loaded','size','percent'], function( key ) {
						file.attachment.unset( key );
					});

					wp.media.model.Attachment.get( id, file.attachment );

					complete = Uploader.queue.all( function( attachment ) {
						return ! attachment.get('uploading');
					});

					if ( complete ) {
						Uploader.queue.reset();
					}

					self.success( file.attachment );
				});
			},

			handleStandardResponse: function( response, file ) {
				if ( ! _.isObject( response ) || _.isUndefined( response.success ) ) {
					return error(pluploadL10n.default_error, null, file);
				} else if ( ! response.success ) {
					return error(response.data && response.data.message, response.data, file);
				}

				file.attachment.set( _.extend( response.data, { uploading: false }) );

				return response.data.id;
			},

			handleRestApiResponse: function( response, file ) {

				if ( response.media.length !== 1) {
					return error( pluploadL10n.default_error, null, file );
				}

				var media = response.media[0],
					mimeParts = media.mime_type.split('/'),
					data = {
						alt : '',
						author : media.author_ID || 0,
						authorName: '',
						caption: '',
						compat: { item: '', meta: '' },
						date: media.date || '',
						dateFormatted: media.date || '',
						description: media.description || '',
						editLink: '',
						filename: media.file || '',
						filesizeHumanReadable: '',
						filesizeInBytes: '',
						height: media.height,
						icon: '',
						id: media.ID || '',
						link: media.URL || '',
						menuOrder: 0,
						meta: false,
						mime: media.mime_type || '',
						modified: 0,
						name: '',
						nonces: { update: '', 'delete': '', edit: '' },
						orientation: '',
						sizes: {},
						status: '',
						subtype: mimeParts[1] || '',
						title: media.title || '',
						type: mimeParts[0] || '',
						uploadedTo: 1,
						uploadedToLink: '',
						uploadedToTitle: '',
						url: media.URL || '',
						width: media.width,
						success: '',
						videopress: {
							guid: media.videopress_guid || null,
							processing_done: media.videopress_processing_done || false
						}
					};

				file.attachment.set( _.extend( data, { uploading: false }) );

				return media.ID;
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

				if ( typeof this.origOptions.file_data_name !== 'undefined' ) {
					up.setOption( 'file_data_name', this.origOptions.file_data_name );
					delete this.origOptions.file_data_name;
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
			var self = this;

			if ( mimeParts[0] === 'video' ) {
				media.ajax( 'videopress-get-upload-token', { async: false } ).done( function ( response ) {
					file.videopress = response;
					cb( true );

				}).fail( function ( response ) {
					self.trigger( 'Error', {
						code : plupload.VIDEOPRESS_TOKEN_FAILURE,
						message : plupload.translate( 'Could not get the videopress token needed for uploading' ),
						file : file,
						response : response
					} );
					cb( false );
				});

			} else {
				// Handles the normal max_file_size functionality.
				var undef;

				// Invalid file size
				if (file.size !== undef && maxSize && file.size > maxSize) {
					this.trigger('Error', {
						code: plupload.FILE_SIZE_ERROR,
						message: plupload.translate('File size error.'),
						file: file
					});
					cb(false);
				} else {
					cb(true);
				}
			}
		});
	}
} )( window.wp, jQuery );

