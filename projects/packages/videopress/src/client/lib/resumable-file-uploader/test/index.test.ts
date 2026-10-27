import { waitFor } from '@testing-library/react';
import resumableFileUploader from '../index';
import type { HttpRequest, HttpResponse } from 'tus-js-client';

// Jest otherwise resolves tus's Node entrypoint, which cannot read a browser File.
jest.mock( 'tus-js-client', () => jest.requireActual( 'tus-js-client/dist/tus.js' ) );

jest.mock( '../../get-media-token', () => ( {
	__esModule: true,
	default: jest.fn( async () => ( { token: 'resume-token' } ) ),
} ) );

it( 'retries a locked HEAD on the same upload instead of creating another upload', async () => {
	const requests: string[] = [];
	const onSuccess = jest.fn();
	const onError = jest.fn();
	const upload = resumableFileUploader( {
		file: new File( [ 'abcdef' ], 'video.mp4', { type: 'video/mp4' } ),
		tokenData: { token: 'token', url: 'https://example.com/uploads/', blogId: '1' },
		onProgress: jest.fn(),
		onSuccess,
		onError,
	} );
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
					if ( requests.length === 1 ) {
						status = 423;
					}
					const responseHeaders = {
						'Upload-Length': '6',
						'Upload-Offset': method === 'HEAD' ? '3' : '6',
						...( method === 'PATCH'
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
	expect( requests ).toEqual( [ 'HEAD', 'HEAD', 'PATCH' ] );
	expect( onError ).not.toHaveBeenCalled();
	await upload.abort();
} );

/**
 * Start an upload whose requests go through the given factory.
 *
 * @param signal        - Aborts the upload.
 * @param createRequest - Builds each HTTP request tus sends.
 */
function uploadWithSignal( signal: AbortSignal, createRequest: jest.Mock ) {
	const upload = resumableFileUploader( {
		file: new File( [ 'abcdef' ], 'video.mp4', { type: 'video/mp4' } ),
		tokenData: { token: 'token', url: 'https://example.com/uploads/', blogId: '1' },
		onProgress: jest.fn(),
		onSuccess: jest.fn(),
		onError: jest.fn(),
		signal,
	} );
	upload.options.httpStack = { getName: () => 'test', createRequest };
}

/**
 * A request that never answers, so the upload stays in flight.
 *
 * @param method - HTTP method.
 * @param url    - Request URL.
 * @param abort  - Called when tus aborts the request.
 * @return The request.
 */
function pendingRequest( method: string, url: string, abort: () => Promise< void > ): HttpRequest {
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
		abort,
		getUnderlyingObject: () => null,
		send: () => new Promise< HttpResponse >( () => {} ),
	};
	return request;
}

it( 'never starts an upload whose signal aborted before tus could start it', async () => {
	const createRequest = jest.fn();
	const controller = new AbortController();
	uploadWithSignal( controller.signal, createRequest );

	controller.abort();
	await new Promise( resolve => setTimeout( resolve, 50 ) );

	expect( createRequest ).not.toHaveBeenCalled();
} );

it( 'aborts the request in flight when the signal aborts', async () => {
	const abort = jest.fn( async () => {} );
	const createRequest = jest.fn( ( method: string, url: string ) =>
		pendingRequest( method, url, abort )
	);
	const controller = new AbortController();
	uploadWithSignal( controller.signal, createRequest );
	await waitFor( () => expect( createRequest ).toHaveBeenCalled() );

	controller.abort();

	expect( abort ).toHaveBeenCalled();
} );
