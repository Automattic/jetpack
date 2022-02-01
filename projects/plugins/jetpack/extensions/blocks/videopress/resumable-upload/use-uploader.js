/**
 * External dependencies
 */
import * as tus from 'tus-js-client';

export const getJWT = function () {
	return new Promise( function ( resolve, reject ) {
		// eslint-disable-next-line no-undef
		wp.media
			.ajax( 'videopress-get-upload-jwt', { async: true } )
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

export const resumableUploader = ( { onError, onProgress, onSuccess } ) => {
	const jwtsForKeys = {}; // TODO seems unecessary
	return ( file, data ) => {
		const upload = new tus.Upload( file, {
			onError: onError,
			onProgress: onProgress,
			endpoint: data.url,
			resume: true,
			removeFingerprintOnSuccess: true,
			withCredentials: false,
			autoRetry: true,
			overridePatchMethod: false,
			chunkSize: 500000, // 500 Kb.
			allowedFileTypes: [ 'video/*' ],
			metadata: {
				filename: file.name,
				filetype: file.type,
			},
			retryDelays: [ 0, 1000, 3000, 5000, 10000 ],
			onAfterResponse: function ( req, res ) {
				// Why is this not showing the x-headers?
				if ( res.getStatus() >= 400 ) {
					return;
				}

				const GUID_HEADER = 'x-videopress-upload-guid';
				const guid = res.getHeader( GUID_HEADER );
				if ( guid ) {
					onSuccess && onSuccess( guid );
					return;
				}

				const headerMap = {
					'x-videopress-upload-key-token': 'token',
					'x-videopress-upload-key': 'key',
					'x-videopress-upload-blog-id': 'blogId',
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
					jwtsForKeys[ data.key ] = tokenData.token;
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
					const path = url.pathname;
					const parts = path.split( '/' );
					const maybeUploadkey = parts[ parts.length - 1 ];
					if ( jwtsForKeys[ maybeUploadkey ] ) {
						req.setHeader( 'x-videopress-upload-token', jwtsForKeys[ maybeUploadkey ] );
					}
				}

				return req;
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
