/**
 * External dependencies
 */
import debugFactory from 'debug';
import * as tus from 'tus-js-client';
/**
 * Internal dependencies
 */
import { VideoGUID } from '../../block-editor/blocks/video/types';
import getMediaToken from '../get-media-token';
import { VideoMediaProps } from './types';
import type { MediaTokenProps } from '../../lib/get-media-token/types';

const debug = debugFactory( 'videopress:resumable-file-uploader' );

const jwtsForKeys = {};

declare module 'tus-js-client' {
	interface Upload {
		_urlStorageKey: string;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type VPUploadHttpRequest = tus.HttpRequest & {
	_method: string;
	_url: string;
	_headers: Record< string, string >;
	_xhr: XMLHttpRequest;
};

type TokenData = {
	token?: string;
	key?: string;
};

type UploadVideoArguments = {
	file: File;
	onProgress: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess: ( media: VideoMediaProps, file: File ) => void;
	onError: ( error ) => void;
	tokenData: MediaTokenProps;
};

const getJwtKey = ( url: string ) => {
	const parsedUrl = new URL( url );
	const path = parsedUrl.pathname;
	const parts = path.split( '/' );
	return parts.pop();
};

const resumableFileUploader = ( {
	file,
	tokenData,
	onProgress,
	onSuccess,
	onError,
}: UploadVideoArguments ) => {
	const upload = new tus.Upload( file, {
		onError,
		onProgress,
		endpoint: tokenData.url,
		removeFingerprintOnSuccess: true,
		overridePatchMethod: false,
		chunkSize: 10000000, // 10 Mb.
		metadata: {
			filename: file.name,
			filetype: file.type,
		},
		retryDelays: [ 0, 1000, 3000, 5000, 10000 ],
		onShouldRetry: function ( err: tus.DetailedError ) {
			const status = err.originalResponse ? err.originalResponse.getStatus() : 0;
			// Do not retry if the status is a 400.
			if ( status === 400 ) {
				debug( 'cleanup retry due to 400 error' );
				localStorage.removeItem( upload._urlStorageKey );
				return false;
			}

			// For any other status code, we retry.
			return true;
		},
		onBeforeRequest: async function ( req: VPUploadHttpRequest ) {
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
			Object.keys( req._headers ).forEach( function ( headerName ) {
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
				const maybeUploadkey = getJwtKey( req._url );
				if ( jwtsForKeys[ maybeUploadkey ] ) {
					req.setHeader( 'x-videopress-upload-token', jwtsForKeys[ maybeUploadkey ] );
				} else if ( 'HEAD' === method ) {
					const responseData = await getMediaToken( 'upload-jwt' );
					if ( responseData?.token ) {
						jwtsForKeys[ maybeUploadkey ] = responseData.token;
						req.setHeader( 'x-videopress-upload-token', responseData.token );
					}
				}
			}
		},
		onAfterResponse: async function ( req, res ) {
			// Why is this not showing the x-headers?
			if ( res.getStatus() >= 400 ) {
				// Return, do nothing, it's handed to invoker's onError.
				debug( 'upload error' );
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

			const _tokenData: TokenData = {};
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
