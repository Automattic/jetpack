import * as tus from 'tus-js-client';

const GUID_HEADER = 'x-videopress-upload-guid';
const MEDIA_ID_HEADER = 'x-videopress-upload-media-id';
const SRC_URL_HEADER = 'x-videopress-upload-src-url';

const extractUploadKeyForUrl = urlString => {
	const url = new URL( urlString );
	const path = url.pathname;
	const parts = path.split( '/' );
	return parts[ parts.length - 1 ];
};

const getJWTTokenMemoized = async function ( key ) {
	if ( jwtsForKeys[ key ] ) {
		return jwtsForKeys[ key ];
	}
	const responseData = await getJWT( key );
	jwtsForKeys[ key ] = responseData.token;
	return jwtsForKeys[ key ];
};

export const getJWT = function ( key ) {
	return new Promise( function ( resolve, reject ) {
		if ( jwtsForKeys[ key ] ) {
			return resolve( jwtsForKeys[ key ] );
		}

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

const completionPolling = () => {
	let polling = false;
	let timerId = null;
	const cleanup = () => {
		timerId && clearTimeout( timerId );
	};

	return {
		cleanup,
		start( url, onSuccess, onError ) {
			if ( polling ) {
				return;
			}

			polling = true;

			const waitSec = 1.5;
			const waitMs = waitSec * 1000;
			const maxRetries = 48 * 60 * ( 60 / waitSec ); // About two days worth of polling.
			const maybeUploadkey = extractUploadKeyForUrl( url );
			const method = 'HEAD';
			let retries = 0;
			const recurse = function recurse() {
				if ( retries >= maxRetries ) {
					cleanup();
					onError && onError( 'Max retries reached.' );
				}

				retries += 1;

				getJWTTokenMemoized( maybeUploadkey ).then( token => {
					const headers = {
						'x-videopress-upload-token': token,
						'X-HTTP-Method-Override': method,
					};

					fetch( url, {
						headers,
						method: 'GET',
					} ).then( res => {
						if ( ! res.ok ) {
							onError && onError( 'HEAD request failed' );
							return;
						}
						const guid = res.headers.get( GUID_HEADER );
						const mediaId = res.headers.get( MEDIA_ID_HEADER );
						const src = res.headers.get( SRC_URL_HEADER );
						if ( src && mediaId && guid ) {
							cleanup();
							onSuccess && onSuccess( { mediaId: Number( mediaId ), guid, src } );
						} else {
							timerId = setTimeout( () => recurse(), waitMs );
						}
					} );
				} );
			};
			recurse();
		},
	};
};

export const resumableUploader = ( { onUploadUuidRetrieved, onError, onProgress, onSuccess } ) => {
	return ( file, data ) => {
		const upload = new tus.Upload( file, {
			onError: function ( msg ) {
				completionPolling().cleanup();
				onError && onError( msg );
			},
			onProgress: onProgress,
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
			},
			retryDelays: [ 0, 1000, 3000, 5000, 10000 ],
			onAfterResponse: function ( req, res ) {
				// Why is this not showing the x-headers?
				const responseStatus = res.getStatus();
				if ( responseStatus >= 400 ) {
					return;
				}

				const guid = res.getHeader( GUID_HEADER );
				const mediaId = res.getHeader( MEDIA_ID_HEADER );
				const src = res.getHeader( SRC_URL_HEADER );
				if ( guid && mediaId && src ) {
					completionPolling().cleanup();
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
				Object.keys( req._headers ).map( function ( headerName ) {
					req.setHeader( headerName, req._headers[ headerName ] );
				} );

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
					const maybeUploadkey = extractUploadKeyForUrl( url );
					completionPolling().start( upload.url, onSuccess, onError );
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

		upload.findPreviousUploads().then( function ( previousUploads ) {
			if ( previousUploads.length ) {
				upload.resumeFromPreviousUpload( previousUploads[ 0 ] );
			}

			upload.start();
		} );

		return upload;
	};
};
