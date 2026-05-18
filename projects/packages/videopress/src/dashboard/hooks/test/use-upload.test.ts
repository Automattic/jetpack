// The mock shape mirrors the actual useResumableUploader return value:
// { onUploadHandler, uploadHandler, resumeHandler, uploadingData, media, error }
//
// We only expose uploadHandler (and a minimal resumeHandler stub) because
// those are the only members used by the adapter.

import { renderHook, act } from '@testing-library/react';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useUpload } from '../use-upload';

const mockUploadHandler = jest.fn();

jest.mock( '../../../client/hooks/use-resumable-uploader', () => ( {
	__esModule: true,
	default: jest.fn( () => ( {
		onUploadHandler: jest.fn(),
		uploadHandler: mockUploadHandler,
		resumeHandler: undefined,
		uploadingData: { bytesSent: 0, bytesTotal: 0, percent: 0, status: 'idle' },
		media: undefined,
		error: null,
	} ) ),
} ) );

describe( 'useUpload', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
	} );

	it( 'exposes an empty queue initially', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		expect( result.current.uploadQueue ).toEqual( [] );
	} );

	it( 'adds an item to the queue when startUpload is called', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		expect( result.current.uploadQueue ).toHaveLength( 1 );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'pending' );
	} );

	it( 'returns a string id from startUpload', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		let id: string | undefined;
		act( () => {
			id = result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		expect( typeof id ).toBe( 'string' );
		expect( id ).toMatch( /^upload-/ );
	} );

	it( 'delegates to the legacy uploadHandler with the file', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file = new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } );
		act( () => {
			result.current.startUpload( file );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledWith( file );
	} );

	it( 'retryUpload re-delegates to the legacy uploadHandler', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file = new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } );
		let id: string | undefined;
		act( () => {
			id = result.current.startUpload( file );
		} );
		mockUploadHandler.mockClear();
		act( () => {
			result.current.retryUpload( id! );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledWith( file );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'pending' );
		expect( result.current.uploadQueue[ 0 ].progress ).toBe( 0 );
	} );

	it( 'retryUpload is a no-op for an unknown id', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.retryUpload( 'upload-does-not-exist' );
		} );
		expect( mockUploadHandler ).not.toHaveBeenCalled();
	} );
} );
