import { waitFor } from '@testing-library/react';
import getMediaToken from '../../get-media-token';
import resumableFileUploader from '../index';
import type { HttpRequest, HttpResponse } from 'tus-js-client';

// Jest otherwise resolves tus's Node entrypoint, which cannot read a browser File.
jest.mock( 'tus-js-client', () => jest.requireActual( 'tus-js-client/dist/tus.js' ) );

jest.mock( '../../get-media-token', () => ( {
	__esModule: true,
	default: jest.fn( async () => ( { token: 'resume-token' } ) ),
} ) );

it.each( [ false, true ] )(
	'retries on the same upload after lock or local completion failure (%s)',
	async completionFailure => {
		const requests: string[] = [];
		// jsdom does not provide fetch.
		// eslint-disable-next-line jest/prefer-spy-on
		global.fetch = jest
			.fn()
			.mockResolvedValueOnce( { ok: false } )
			.mockResolvedValue( { ok: true, json: async () => ( { success: true } ) } );

		if ( completionFailure ) {
			window.videopressAjax = { ...window.videopressAjax, ajaxUrl: '/wp-admin/admin-ajax.php' };
			window.videopressUpload = {
				attachmentFirst: true,
				nonce: 'nonce',
				url: 'https://example.com/uploads/',
			};
		}
		const onSuccess = jest.fn();
		const onError = jest.fn();
		const upload = resumableFileUploader( {
			file: new File( [ 'abcdef' ], 'video.mp4', { type: 'video/mp4' } ),
			tokenData: { token: 'token', url: 'https://example.com/uploads/', blogId: '1' },
			onProgress: jest.fn(),
			onSuccess,
			onError,
		} );
		upload.options.retryDelays = [ 0 ];
		const uploadUrl = 'https://example.com/uploads/existing';
		upload.url = uploadUrl;
		upload.options.httpStack = {
			getName: () => 'test',
			createRequest: ( method, url ): HttpRequest => {
				expect( url ).toBe( uploadUrl );
				const headers: Record< string, string > = {};
				const request = {
					_method: method,
					_url: url,
					_headers: headers,
					_xhr: { open: jest.fn() },
					getMethod: () => method,
					getURL: () => url,
					setHeader: ( name: string, value: string ) => {
						headers[ name ] = value;
					},
					getHeader: ( name: string ) => headers[ name ],
					setProgressHandler: jest.fn(),
					abort: async () => {},
					getUnderlyingObject: () => null,
					send: async (): Promise< HttpResponse > => {
						requests.push( method );
						let status = method === 'HEAD' ? 200 : 204;
						if ( requests.length === 1 && ! completionFailure ) {
							status = 423;
						}
						const responseHeaders = {
							'Upload-Length': '6',
							'Upload-Offset': method === 'HEAD' && ! completionFailure ? '3' : '6',
							...( method === 'PATCH' || completionFailure
								? {
										'x-videopress-upload-guid': 'abc123',
										'x-videopress-upload-media-id': '42',
										'x-videopress-upload-src-url': 'https://example.com/video.mp4',
									}
								: {} ),
						};
						return {
							getStatus: () => status,
							getHeader: name => responseHeaders[ name ],
							getBody: () => '',
							getUnderlyingObject: () => null,
						};
					},
				};
				return request;
			},
		};
		await waitFor( () => {
			expect( onError.mock.calls ).toEqual( [] );
			expect( onSuccess ).toHaveBeenCalledTimes( 1 );
		} );
		expect( requests ).toEqual(
			completionFailure ? [ 'HEAD', 'HEAD' ] : [ 'HEAD', 'HEAD', 'PATCH' ]
		);
		expect( global.fetch ).toHaveBeenCalledTimes( completionFailure ? 2 : 0 );
		delete window.videopressUpload;
		expect( onError ).not.toHaveBeenCalled();
		await upload.abort();
	}
);

it( 'keeps the attachment ID and reconnect error code when token acquisition fails before POST', async () => {
	jest.mocked( getMediaToken ).mockResolvedValueOnce( { token: null, attachmentId: 42 } );
	const onError = jest.fn();
	const upload = resumableFileUploader( {
		file: new File( [ 'x' ], 'new.mp4' ),
		tokenData: { token: null, url: 'https://example.com/uploads/' },
		onProgress: jest.fn(),
		onSuccess: jest.fn(),
		onError,
	} );
	upload.options.retryDelays = [];
	await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
	expect( onError.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
		code: 'videopress_no_upload_token',
		attachmentId: 42,
	} );
	await upload.abort();
} );
