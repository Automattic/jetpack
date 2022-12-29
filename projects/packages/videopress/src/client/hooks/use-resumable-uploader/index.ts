/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import debugFactory from 'debug';
import * as tus from 'tus-js-client';
/**
 * Types
 */
import { VideoGUIDProp, VideoIdProp } from '../../block-editor/blocks/video/types';
import { MediaTokenProps } from '../../lib/get-media-token/types';
import type React from 'react';

const debug = debugFactory( 'videopress:resumable-upload' );

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

export const uploadVideo = ( { file, onProgress, onSuccess, onError, tokenData } ) => {
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
					return getJWT( maybeUploadkey ).then( responseData => {
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

			const guid: VideoGUIDProp = res.getHeader( GUID_HEADER );
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

type StatusProp = 'idle' | 'resumed' | 'aborted' | 'uploading' | 'done' | 'error';

type VideoMediaProps = { id: VideoIdProp; guid: VideoIdProp; src: string };

type UploadingDataProps = {
	bytesSent: number;
	bytesTotal: number;
	percent: number;
	status: StatusProp;
};

type UseResumableUploader = {
	onUploadHandler: ( event: React.ChangeEvent< HTMLInputElement > ) => void;
	uploadhandler: ( file: File ) => void;
	resumeHandler: () => void;
	uploadingData: UploadingDataProps;
	media: VideoMediaProps;
	error: string;
};

export const useResumableUploader = ( {
	onProgress,
	onSuccess,
	onError,
} ): UseResumableUploader => {
	const [ uploadingData, setUploadingData ] = useState< UploadingDataProps >( {
		bytesSent: 0,
		bytesTotal: 0,
		percent: 0,
		status: 'idle',
	} );

	const [ media, setMedia ] = useState< VideoMediaProps >();
	const [ error, setError ] = useState( null );
	const [ resumeHandler, setResumeHandler ] = useState( null );

	/**
	 * Upload a file
	 *
	 * @param {File} file - the file to upload
	 */
	function uploadhandler( file: File ) {
		getJWT()
			.then( ( tokenData: MediaTokenProps ) => {
				if ( ! tokenData.token ) {
					debug( 'No token data' );
					return;
				}

				if ( status === 'idle' ) {
					setUploadingData( prev => ( { ...prev, status: 'uploading' } ) );
				}

				const resumableHandler = uploadVideo( {
					file,
					tokenData,
					onProgress: ( bytesSent: number, bytesTotal: number ) => {
						const percent = Math.round( ( bytesSent / bytesTotal ) * 100 );
						setUploadingData( { bytesSent, bytesTotal, percent, status: 'uploading' } );
						onProgress( bytesSent, bytesTotal );
					},
					onSuccess: ( data: VideoMediaProps ) => {
						setUploadingData( prev => ( { ...prev, status: 'done' } ) );
						setMedia( data );
						onSuccess( data );
					},
					onError: ( err: Error ) => {
						setUploadingData( prev => ( { ...prev, status: 'error' } ) );
						setError( err );
						onError( err );
					},
				} );

				const resumable = {
					...resumableHandler,
					start: () => {
						setUploadingData( prev => ( { ...prev, status: 'uploading' } ) );
						resumableHandler.start();
					},
					abort: () => {
						setUploadingData( prev => ( { ...prev, status: 'aborted' } ) );
						resumableHandler.abort();
					},
				};

				setResumeHandler( resumable );
			} )
			.catch( jwtError => {
				setError( jwtError );
			} );
	}

	/**
	 * Handler for the file upload
	 *
	 * @param {React.ChangeEvent< HTMLInputElement >} event - the event object
	 */
	function onUploadHandler( event: React.ChangeEvent< HTMLInputElement > ) {
		const file = event.target.files[ 0 ];
		if ( ! file ) {
			debug( 'No file selected. Bail early' );
			return;
		}

		uploadhandler( file );
	}

	return { onUploadHandler, uploadhandler, resumeHandler, uploadingData, media, error };
};
