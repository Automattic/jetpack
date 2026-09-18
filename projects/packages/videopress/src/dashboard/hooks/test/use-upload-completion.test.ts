import { act, renderHook } from '@testing-library/react';
import * as tus from 'tus-js-client';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useUpload, __resetUploadStoreForTests } from '../use-upload';

jest.mock( '../../../client/lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn().mockResolvedValue( {
		token: 'test-token',
		url: 'https://example.com/uploads',
	} ),
} ) );

jest.mock( 'tus-js-client', () => ( {
	Upload: jest.fn().mockImplementation( () => ( {
		findPreviousUploads: jest.fn().mockResolvedValue( [] ),
		start: jest.fn(),
	} ) ),
} ) );

describe( 'upload completion queue integration', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		__resetUploadStoreForTests();
	} );

	it( 'does not apply repeated completion or late callbacks to the next upload', async () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		await act( async () => {
			result.current.startUpload( new File( [ 'first' ], 'first.mp4' ) );
			result.current.startUpload( new File( [ 'second' ], 'second.mp4' ) );
		} );
		const firstOptions = jest.mocked( tus.Upload ).mock.calls[ 0 ][ 1 ]!;
		const headers = {
			'x-videopress-upload-guid': 'testGUID',
			'x-videopress-upload-media-id': '123',
			'x-videopress-upload-src-url': 'https://example.com/video.mp4',
		};
		const response = {
			getStatus: () => 200,
			getHeader: ( name: string ) => headers[ name ] ?? null,
		} as tus.HttpResponse;

		await act( async () => {
			await firstOptions.onAfterResponse!( {} as tus.HttpRequest, response );
		} );
		expect( tus.Upload ).toHaveBeenCalledTimes( 2 );

		await act( async () => {
			await firstOptions.onAfterResponse!( {} as tus.HttpRequest, response );
			firstOptions.onProgress!( 5, 5 );
			firstOptions.onError!( new Error( 'Late transport error' ) );
		} );

		expect( result.current.uploadQueue.map( item => item.status ) ).toEqual( [
			'success',
			'pending',
		] );
		expect( result.current.uploadQueue[ 1 ].progress ).toBe( 0 );
	} );
} );
