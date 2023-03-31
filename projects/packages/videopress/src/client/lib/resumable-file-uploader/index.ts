/**
 * External dependencies
 */
import * as tus from 'tus-js-client';
/**
 * Internal dependencies
 */
import { VideoGUID } from '../../block-editor/blocks/video/types';
import getMediaToken from '../get-media-token';
import { VideoMediaProps } from './types';
import type { MediaTokenProps } from '../../lib/get-media-token/types';

const jwtsForKeys = {};

type UploadVideoArguments = {
	file: File;
	onProgress: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess: ( media: VideoMediaProps, file: File ) => void;
	onError: ( error ) => void;
	tokenData: MediaTokenProps;
};

const resumableFileUploader = ( {
	file,
	tokenData,
	onProgress,
	onSuccess,
	onError,
}: UploadVideoArguments ) => {
	const upload = new tus.Upload( file, {
		onError: onError,
		onProgress,
		endpoint: tokenData.url,
		removeFingerprintOnSuccess: true,
		withCredentials: false,
		autoRetry: true,
		overridePatchMethod: false,
		chunkSize: 10000000, // 10 Mb.
		metadata: {
			filename: file.name,
			filetype: file.type,
		},
		retryDelays: [ 0, 1000, 3000, 5000, 10000 ],
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
				const hasJWT = !! tokenData.token;
				if ( hasJWT ) {
					req.setHeader( 'x-videopress-upload-token', tokenData.token );
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
					return getMediaToken( 'upload-jwt' ).then( responseData => {
						jwtsForKeys[ maybeUploadkey ] = responseData.token;
						req.setHeader( 'x-videopress-upload-token', responseData.token );
						return req;
					} );
				}
			}

			return Promise.resolve( req );
		},
		onAfterResponse: function ( req, res ) {
			// Why is this not showing the x-headers?
			if ( res.getStatus() >= 400 ) {
				return;
			}

			const GUID_HEADER = 'x-videopress-upload-guid';
			const MEDIA_ID_HEADER = 'x-videopress-upload-media-id';
			const SRC_URL_HEADER = 'x-videopress-upload-src-url';

			const guid: VideoGUID = res.getHeader( GUID_HEADER );
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

			const _tokenData = {};
			Object.keys( headerMap ).forEach( function ( header ) {
				const value = res.getHeader( header );
				if ( ! value ) {
					return;
				}

				_tokenData[ headerMap[ header ] ] = value;
			} );

			if ( _tokenData.key && _tokenData.token ) {
				jwtsForKeys[ _tokenData.key ] = _tokenData.token;
			}
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

export default resumableFileUploader;
