import { act, renderHook } from '@testing-library/react';
import getMediaToken from '../../../lib/get-media-token';
import resumableFileUploader from '../../../lib/resumable-file-uploader';
import useResumableUploader, {
	UPLOAD_TOKEN_ERROR_CODE,
	UploadTokenError,
	isConnectionAttributedFailure,
} from '../index';
import type { ChangeEvent } from 'react';

jest.mock( '../../../lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '../../../lib/resumable-file-uploader', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

describe( 'useResumableUploader', () => {
	const tokenData = { token: 'token', url: 'https://example.com/upload', blogId: '1' };
	const file = new File( [ 'video' ], 'video.mp4', { type: 'video/mp4' } );
	const mockToken = jest.mocked( getMediaToken );
	const mockUploader = jest.mocked( resumableFileUploader );
	const transport = { start: jest.fn(), abort: jest.fn() };
	const handlers = { onProgress: jest.fn(), onSuccess: jest.fn(), onError: jest.fn() };

	beforeEach( () => {
		jest.clearAllMocks();
		mockToken.mockResolvedValue( tokenData );
		mockUploader.mockReturnValue(
			transport as unknown as ReturnType< typeof resumableFileUploader >
		);
	} );

	it( 'reports progress and completion without letting late progress restart a completed upload', async () => {
		const { result } = renderHook( () => useResumableUploader( handlers ) );
		expect( result.current.uploadingData ).toEqual( {
			bytesSent: 0,
			bytesTotal: 0,
			percent: 0,
			status: 'idle',
		} );
		await act( async () => result.current.uploadHandler( file ) );
		expect( mockToken ).toHaveBeenCalledWith( 'upload-jwt' );
		expect( mockUploader ).toHaveBeenCalledWith( expect.objectContaining( { file, tokenData } ) );
		expect( result.current.uploadingData.status ).toBe( 'uploading' );

		const callbacks = mockUploader.mock.calls[ 0 ][ 0 ];
		act( () => callbacks.onProgress( 2, 3 ) );
		expect( result.current.uploadingData ).toEqual( {
			bytesSent: 2,
			bytesTotal: 3,
			percent: 67,
			status: 'uploading',
		} );
		expect( handlers.onProgress ).toHaveBeenCalledWith( 2, 3 );

		const media = { id: 42, guid: 'abc123', src: 'https://example.com/video.mp4' };
		act( () => callbacks.onSuccess( media, file ) );
		expect( result.current.media ).toEqual( media );
		expect( handlers.onSuccess ).toHaveBeenCalledWith( media );
		act( () => callbacks.onProgress( 3, 3 ) );
		expect( result.current.uploadingData.status ).toBe( 'done' );
		expect( handlers.onProgress ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'aborts and resumes the same upload while reflecting its status', async () => {
		const { result } = renderHook( () => useResumableUploader( handlers ) );
		await act( async () => result.current.uploadHandler( file ) );
		act( () => result.current.resumeHandler.abort() );
		expect( transport.abort ).toHaveBeenCalledTimes( 1 );
		expect( result.current.uploadingData.status ).toBe( 'aborted' );
		act( () => result.current.resumeHandler.start() );
		expect( transport.start ).toHaveBeenCalledTimes( 1 );
		expect( result.current.uploadingData.status ).toBe( 'uploading' );
		expect( mockUploader ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'retains a transport error and forwards it to the caller', async () => {
		const { result } = renderHook( () => useResumableUploader( handlers ) );
		await act( async () => result.current.uploadHandler( file ) );
		const error = new Error( 'Connection lost' );
		act( () => mockUploader.mock.calls[ 0 ][ 0 ].onError( error ) );
		expect( result.current.uploadingData.status ).toBe( 'error' );
		expect( result.current.error ).toBe( error );
		expect( handlers.onError ).toHaveBeenCalledWith( error );
	} );

	it( 'reports a missing token without starting the transport', async () => {
		mockToken.mockResolvedValueOnce( { token: null } );
		const { result } = renderHook( () => useResumableUploader( handlers ) );
		await act( async () => result.current.uploadHandler( file ) );
		expect( handlers.onError ).toHaveBeenCalledWith( expect.any( UploadTokenError ) );
		expect( mockUploader ).not.toHaveBeenCalled();
	} );

	it( 'uploads the selected file and ignores a cancelled file picker', async () => {
		const { result } = renderHook( () => useResumableUploader( handlers ) );
		const input = document.createElement( 'input' );
		Object.defineProperty( input, 'files', { configurable: true, value: [] } );
		const event = { target: input } as ChangeEvent< HTMLInputElement >;
		await act( async () => result.current.onUploadHandler( event ) );
		expect( mockToken ).not.toHaveBeenCalled();
		expect( mockUploader ).not.toHaveBeenCalled();

		Object.defineProperty( input, 'files', { value: [ file ] } );
		await act( async () => result.current.onUploadHandler( event ) );
		expect( mockUploader ).toHaveBeenCalledWith( expect.objectContaining( { file } ) );
	} );
} );

describe( 'UploadTokenError', () => {
	it( 'carries the code consumers branch on', () => {
		expect( new UploadTokenError().code ).toBe( UPLOAD_TOKEN_ERROR_CODE );
		expect( UPLOAD_TOKEN_ERROR_CODE ).toBe( 'videopress_no_upload_token' );
	} );

	it( 'is a real Error, so a caller that only reads `message` still works', () => {
		const error = new UploadTokenError();

		expect( error ).toBeInstanceOf( Error );
		expect( error.message ).toBe( 'No token provided' );
	} );
} );

describe( 'isConnectionAttributedFailure', () => {
	it( 'attributes a token failure on a site reporting a connection error', () => {
		expect( isConnectionAttributedFailure( UPLOAD_TOKEN_ERROR_CODE, true ) ).toBe( true );
	} );

	it( 'needs both halves: a missing token says the upload never left, not why', () => {
		expect( isConnectionAttributedFailure( UPLOAD_TOKEN_ERROR_CODE, false ) ).toBe( false );
	} );

	it( 'needs both halves: a connection error alone does not explain any failure', () => {
		expect( isConnectionAttributedFailure( undefined, true ) ).toBe( false );
	} );
} );
