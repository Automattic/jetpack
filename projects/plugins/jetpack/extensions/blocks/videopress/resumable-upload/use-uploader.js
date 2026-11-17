import * as tus from 'tus-js-client';

export const getJWT = function ( key ) {
	return new Promise( function ( resolve, reject ) {
		const extras = key ? { data: { key } } : {};
		// eslint-disable-next-line no-undef
		wp.media
			.ajax( 'videopress-get-upload-jwt', { async: true, ...extras } )
			.done( function ( response ) {
				resolve( {
					token: response.upload_token,
					blogId: response.upload_blog_id,
					url: response.upload_action_url,
				} );
			} )
			.fail( function ( reason ) {
				reject( reason );
			} );
	} );
};

const jwtsForKeys = {};

export const resumableUploader = ( {
	onUploadUuidRetrieved,
	onError,
	onProgress,
	onSuccess,
	analytics,
	signal,
} ) => {
	return ( file, data ) => {
		let ready = false;
		let paused = false;
		let resumedExisting = false;
		const upload = new tus.Upload( file, {
			onError: error => {
				if ( signal?.aborted ) {
					return;
				}
				analytics?.fail( error, 'transfer' );
				onError( error );
			},
			onProgress: ( sent, total ) => {
				if ( signal?.aborted ) {
					return;
				}
				analytics?.progress( sent );
				onProgress( sent, total );
			},
			endpoint: data.url,
			removeFingerprintOnSuccess: true,
			withCredentials: false,
			autoRetry: true,
			overridePatchMethod: false,
			chunkSize: 10000000, // 10 Mb.
			allowedFileTypes: [ 'video/*' ],
			metadata: {
				filename: file.name,
				filetype: file.type,
				...analytics?.metadata(),
			},
			retryDelays: [ 0, 1000, 3000, 5000, 10000 ],
			onShouldRetry: function ( error, attempt, options ) {
				const retry = tus.defaultOptions.onShouldRetry( error, attempt, options );
				if ( retry && ! signal?.aborted ) {
					analytics?.retryScheduled();
				}
				return retry;
			},
			onAfterResponse: function ( req, res ) {
				if ( signal?.aborted ) {
					return;
				}
				// Why is this not showing the x-headers?
				const responseStatus = res.getStatus();
				if ( responseStatus >= 400 ) {
					return;
				}

				const GUID_HEADER = 'x-videopress-upload-guid';
				const MEDIA_ID_HEADER = 'x-videopress-upload-media-id';
				const SRC_URL_HEADER = 'x-videopress-upload-src-url';
				const guid = res.getHeader( GUID_HEADER );
				const mediaId = res.getHeader( MEDIA_ID_HEADER );
				const src = res.getHeader( SRC_URL_HEADER );
				if ( guid && mediaId && src ) {
					analytics?.succeed( guid );
					onSuccess && onSuccess( { mediaId: Number( mediaId ), guid, src } );
					return;
				}

				const headerMap = {
					'x-videopress-upload-key-token': 'token',
					'x-videopress-upload-key': 'key',
				};

				const tokenData = {};
				Object.keys( headerMap ).forEach( function ( header ) {
					const value = res.getHeader( header );
					if ( ! value ) {
						return;
					}

					tokenData[ headerMap[ header ] ] = value;
				} );

				if ( tokenData.key && tokenData.token ) {
					jwtsForKeys[ tokenData.key ] = tokenData.token;
				}

				if ( tokenData.key ) {
					onUploadUuidRetrieved( tokenData.key );
				}
			},
			onBeforeRequest: function ( req ) {
				if ( ! signal?.aborted ) {
					analytics?.requestStarted();
				}
				// make ALL requests be either POST or GET to honor the public-api.wordpress.com "contract".
				const method = req._method;
				if ( [ 'HEAD', 'OPTIONS' ].indexOf( method ) >= 0 ) {
					req._method = 'GET';
					req.setHeader( 'X-HTTP-Method-Override', method );
				}

				if ( [ 'DELETE', 'PUT', 'PATCH' ].indexOf( method ) >= 0 ) {
					req._method = 'POST';
					req.setHeader( 'X-HTTP-Method-Override', method );
				}

				req._xhr.open( req._method, req._url, true );
				// Set the headers again, reopening the xhr resets them.
				for ( const headerName of Object.keys( req._headers ) ) {
					req.setHeader( headerName, req._headers[ headerName ] );
				}

				if ( 'POST' === method ) {
					const hasJWT = !! data.token;
					if ( hasJWT ) {
						req.setHeader( 'x-videopress-upload-token', data.token );
					} else {
						throw 'should never happen';
					}
				}

				if ( [ 'OPTIONS', 'GET', 'HEAD', 'DELETE', 'PUT', 'PATCH' ].indexOf( method ) >= 0 ) {
					const url = new URL( req._url );
					const path = url.pathname;
					const parts = path.split( '/' );
					const maybeUploadkey = parts[ parts.length - 1 ];
					if ( jwtsForKeys[ maybeUploadkey ] ) {
						req.setHeader( 'x-videopress-upload-token', jwtsForKeys[ maybeUploadkey ] );
					} else if ( 'HEAD' === method ) {
						return getJWT( maybeUploadkey ).then( responseData => {
							jwtsForKeys[ maybeUploadkey ] = responseData.token;
							req.setHeader( 'x-videopress-upload-token', responseData.token );
							return req;
						} );
					}
				}

				return Promise.resolve( req );
			},
		} );

		const controls = {
			start() {
				if ( signal?.aborted ) {
					return;
				}
				paused = false;
				analytics?.start();
				if ( ready ) {
					if ( resumedExisting ) {
						analytics?.resumedExisting();
						resumedExisting = false;
					}
					upload.start();
				}
			},
			abort() {
				paused = true;
				analytics?.pause();
				return upload.abort();
			},
		};
		signal?.addEventListener( 'abort', () => controls.abort(), { once: true } );
		upload.findPreviousUploads().then(
			previousUploads => {
				if ( signal?.aborted ) {
					return;
				}
				if ( previousUploads.length ) {
					upload.resumeFromPreviousUpload( previousUploads[ 0 ] );
					resumedExisting = true;
				}
				ready = true;
				if ( ! paused ) {
					controls.start();
				}
			},
			error => {
				if ( ! signal?.aborted ) {
					analytics?.fail( error, 'resume_lookup' );
					onError( error );
				}
			}
		);

		return controls;
	};
};
