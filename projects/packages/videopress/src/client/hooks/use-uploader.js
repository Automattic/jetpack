/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import * as tus from 'tus-js-client';

const jwtsForKeys = {};

export const getJWT = function () {
	return new Promise( function ( resolve, reject ) {
		apiFetch( {
			path: '/wpcom/v2/videopress/upload-jwt',
			method: 'POST',
		} )
			.then( response => {
				resolve( {
					token: response.upload_token,
					blogId: response.upload_blog_id,
					url: response.upload_url,
				} );
			} )
			.catch( error => {
				reject( error );
			} );
	} );
};

export const uploadVideo = ( { file, onProgress, onSuccess, onError, data } ) => {
	const upload = new tus.Upload( file, {
		onError: onError,
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
			if ( res.getStatus() >= 400 ) {
				return;
			}

			const GUID_HEADER = 'x-videopress-upload-guid';
			const MEDIA_ID_HEADER = 'x-videopress-upload-media-id';
			const SRC_URL_HEADER = 'x-videopress-upload-src-url';

			const guid = res.getHeader( GUID_HEADER );
			const mediaId = res.getHeader( MEDIA_ID_HEADER );
			const src = res.getHeader( SRC_URL_HEADER );

			if ( guid && mediaId && src ) {
				onSuccess && onSuccess( { id: Number( mediaId ), guid, src }, file );
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

export const useResumableUploader = ( { onError, onProgress, onSuccess } ) => {
	const [ data, setData ] = useState( {} );
	const [ error, setError ] = useState( null );

	// collect the jwt for the key
	useEffect( () => {
		getJWT()
			.then( setData )
			.catch( jwtError => {
				setError( jwtError );
				onError?.( jwtError );
			} );
	}, [] );

	const uploaded = file =>
		uploadVideo( {
			file,
			onProgress,
			onSuccess,
			onError,
			data,
		} );

	return [ uploaded, data, error ];
};
