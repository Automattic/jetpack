/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import * as tus from 'tus-js-client';
/**
 * Internal dependencies
 */
import { VideoGUID } from '../../block-editor/blocks/video/types';
import getMediaToken from '../get-media-token';
import { UploadTokenError } from './token-error';
import { VideoMediaProps } from './types';
import type { MediaTokenProps } from '../../lib/get-media-token/types';

const debug = debugFactory( 'videopress:resumable-file-uploader' );

/**
 * HTTP status codes that are safe to retry.
 *
 * @see https://github.com/tfredrich/RestApiTutorial.com/blob/master/content/advanced/responses/retries.md
 */
const RETRIABLE_STATUS_CODES = [ 408, 423, 429, 500, 502, 503, 504 ];

const jwtsForKeys = {};

declare module 'tus-js-client' {
	interface Upload {
		_urlStorageKey: string;
	}
}

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
	tokenData?: MediaTokenProps;
};

const getJwtKey = ( url: string ) => {
	const parsedUrl = new URL( url );
	const path = parsedUrl.pathname;
	const parts = path.split( '/' );
	return parts.pop();
};

const resumableFileUploader = ( {
	file,
	tokenData = { token: null, url: window.videopressUpload?.url },
	onProgress,
	onSuccess,
	onError,
}: UploadVideoArguments ) => {
	let completed = false;
	const reportError = error => {
		let cause = error;
		while ( cause?.causingError ) {
			cause = cause.causingError;
		}
		if ( cause?.code ) {
			error.code = cause.code;
		}
		error.attachmentId = tokenData.attachmentId;
		onError( error );
	};
	const upload = new tus.Upload( file, {
		onError: reportError,
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

			// Only retry on transient errors (timeouts, upload locks, rate limits, server errors).
			if ( status >= 400 && ! RETRIABLE_STATUS_CODES.includes( status ) ) {
				debug( 'not retrying due to %d error', status );
				localStorage.removeItem( upload._urlStorageKey );
				return false;
			}

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
				if ( ! tokenData.token ) {
					tokenData = await getMediaToken( 'upload-jwt', {
						filename: file.name,
						attachmentId: tokenData.attachmentId,
					} );
				}
				const hasJWT = !! tokenData.token;
				if ( hasJWT ) {
					req.setHeader( 'x-videopress-upload-token', tokenData.token );
				} else {
					throw new UploadTokenError();
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

			if ( guid && mediaId && src && ! completed ) {
				if ( tokenData.attachmentId && Number( mediaId ) !== tokenData.attachmentId ) {
					throw new Error(
						__(
							'The upload returned a different attachment. Please retry to check it.',
							'jetpack-videopress-pkg'
						)
					);
				}
				if ( window.videopressUpload?.attachmentFirst ) {
					const options: RequestInit = {
						method: 'POST',
						credentials: 'same-origin',
						body: new URLSearchParams( {
							action: 'videopress-complete-upload',
							post_id: mediaId,
							nonce: window.videopressUpload.nonce,
						} ),
					};
					const url = window.videopressAjax.ajaxUrl;
					const response =
						window.GBKit && typeof ( window.wp as WpGlobal | undefined )?.apiFetch === 'function'
							? await ( window.wp as Required< WpGlobal > ).apiFetch( {
									url,
									...options,
									parse: false,
								} )
							: await fetch( url, options );
					if ( ! response.ok || ! ( await response.json() ).success ) {
						throw new Error(
							__(
								'The upload finished, but its attachment could not be updated. Please retry to check it.',
								'jetpack-videopress-pkg'
							)
						);
					}
				}
				completed = true;
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

	upload
		.findPreviousUploads()
		.then( function ( previousUploads ) {
			if ( previousUploads.length ) {
				upload.resumeFromPreviousUpload( previousUploads[ 0 ] );
			}

			upload.start();
		} )
		.catch( reportError );

	return upload;
};

export default resumableFileUploader;
