import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import getMediaToken from '../../../client/lib/get-media-token';
import resumableFileUploader from '../../../client/lib/resumable-file-uploader';
import { syncChapters } from '../../../client/utils/video-chapters/sync-chapters';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { LIBRARY_QUERY_KEY } from '../use-library';
import { useUpload, __resetUploadStoreForTests } from '../use-upload';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../client/lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '../../../client/lib/resumable-file-uploader', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '../../../client/utils/video-chapters/sync-chapters', () => ( {
	syncChapters: jest.fn(),
} ) );

const mockToken = jest.mocked( getMediaToken );
const mockUploader = jest.mocked( resumableFileUploader );
const mockFetch = jest.mocked( apiFetch );
const media = { id: 101, guid: 'abc123', src: 'https://example.com/a.mp4' };
const file = () => new File( [ 'x' ], 'same-name.mp4', { type: 'video/mp4' } );
const callbacks = ( index = 0 ) => mockUploader.mock.calls[ index ][ 0 ];
const start = async ( result: { current: ReturnType< typeof useUpload > } ) => {
	let id: string;
	await act( async () => {
		id = result.current.startUpload( file() );
	} );
	return id!;
};
const succeed = async ( index = 0, id = media.id ) => {
	await act( async () => {
		callbacks( index ).onSuccess( { ...media, id }, file() );
	} );
};

beforeEach( () => {
	jest.clearAllMocks();
	__resetUploadStoreForTests();
	mockToken.mockResolvedValue( { token: 'token', url: 'https://example.com/upload', blogId: '1' } );
	mockFetch.mockResolvedValue( undefined );
} );

it( 'shares uploads across consumers and continues the queue after the initiating route unmounts', async () => {
	const wrapper = createTestWrapper();
	const { result: producer, unmount } = renderHook( useUpload, { wrapper } );
	const firstId = await start( producer );
	const secondId = await start( producer );
	expect( firstId ).not.toBe( secondId );
	unmount();
	const { result: observer } = renderHook( useUpload, { wrapper } );
	await start( observer );
	expect( mockUploader ).toHaveBeenCalledTimes( 1 );
	await succeed();
	expect( mockUploader ).toHaveBeenCalledTimes( 2 );
	expect( observer.current.completedUploads[ firstId ] ).toBe( '101' );
	await succeed( 1, 102 );
	expect( mockUploader ).toHaveBeenCalledTimes( 3 );
} );

it( 'keeps edits per temporary ID and sends nothing until that upload completes', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const first = await start( result );
	const second = await start( result );
	act( () => {
		result.current.saveUploadDetails( first, { title: 'First', privacy: 'private' } );
		result.current.saveUploadDetails( second, { title: 'Second', allowDownloads: true } );
		callbacks().onProgress( 5, 10 );
	} );
	expect( mockFetch ).not.toHaveBeenCalled();
	expect( result.current.uploadQueue[ 0 ].progress ).toBe( 0.5 );
	await succeed();
	expect( mockFetch ).toHaveBeenCalledWith(
		expect.objectContaining( {
			method: 'POST',
			data: { id: 101, title: 'First', privacy_setting: 1 },
		} )
	);
	await succeed( 1, 102 );
	expect( mockFetch ).toHaveBeenLastCalledWith(
		expect.objectContaining( {
			data: { id: 102, title: 'Second', allow_download: true },
		} )
	);
} );

it( 'sends another Save queued during the final save before completing the temporary route', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const id = await start( result );
	act( () => result.current.saveUploadDetails( id, { title: 'First' } ) );
	let resolveSave: () => void;
	mockFetch.mockImplementationOnce(
		() =>
			new Promise( resolve => {
				resolveSave = () => resolve( undefined );
			} )
	);
	await succeed();
	expect( result.current.completedUploads[ id ] ).toBeUndefined();
	act( () => result.current.saveUploadDetails( id, { title: 'Latest' } ) );
	await act( async () => {
		resolveSave!();
	} );
	expect( mockFetch ).toHaveBeenLastCalledWith(
		expect.objectContaining( { data: { id: 101, title: 'Latest' } } )
	);
	expect( result.current.completedUploads[ id ] ).toBe( '101' );
} );

it( 'retains a failed metadata draft and retries its save without uploading again', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const id = await start( result );
	act( () => result.current.saveUploadDetails( id, { title: '' } ) );
	mockFetch.mockRejectedValueOnce( new Error( 'Offline' ) );
	await succeed();
	expect( result.current.uploadQueue[ 0 ] ).toMatchObject( {
		detailsError: true,
		details: { title: '' },
	} );
	expect( result.current.completedUploads[ id ] ).toBeUndefined();
	await act( async () => result.current.retryUpload( id ) );
	expect( mockUploader ).toHaveBeenCalledTimes( 1 );
	expect( mockFetch ).toHaveBeenLastCalledWith(
		expect.objectContaining( { data: { id: 101, title: '' } } )
	);
	expect( result.current.completedUploads[ id ] ).toBe( '101' );
} );

it( 'refreshes the library before saving edits so a failed save still counts the attachment', async () => {
	const client = createTestQueryClient();
	const invalidate = jest.spyOn( client, 'invalidateQueries' );
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper( client ) } );
	const id = await start( result );
	act( () => result.current.saveUploadDetails( id, { title: 'Draft' } ) );
	mockFetch.mockRejectedValueOnce( new Error( 'Offline' ) );
	await succeed();
	expect( result.current.uploadQueue[ 0 ].detailsError ).toBe( true );
	expect( invalidate ).toHaveBeenCalledWith( { queryKey: [ LIBRARY_QUERY_KEY ] } );
} );

it( 'applies a new Save after a metadata failure without reuploading', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const id = await start( result );
	act( () => result.current.saveUploadDetails( id, { title: 'First' } ) );
	mockFetch.mockRejectedValueOnce( new Error( 'Offline' ) );
	await succeed();
	expect( result.current.uploadQueue[ 0 ].detailsError ).toBe( true );
	await act( async () =>
		result.current.saveUploadDetails( id, { title: 'Retry with this title' } )
	);
	expect( mockFetch ).toHaveBeenLastCalledWith(
		expect.objectContaining( { data: { id: 101, title: 'Retry with this title' } } )
	);
	expect( mockUploader ).toHaveBeenCalledTimes( 1 );
	expect( result.current.completedUploads[ id ] ).toBe( '101' );
} );

it( 'retains edits after transport failure, continues the queue, and serializes retries', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const first = await start( result );
	await start( result );
	act( () => result.current.saveUploadDetails( first, { title: 'Retained' } ) );
	await act( async () =>
		callbacks().onError( Object.assign( new Error( 'Offline' ), { code: 'offline' } ) )
	);
	expect( result.current.uploadQueue[ 0 ] ).toMatchObject( {
		status: 'failed',
		errorCode: 'offline',
	} );
	act( () => {
		result.current.retryUpload( first );
		result.current.retryUpload( first );
	} );
	expect( mockUploader ).toHaveBeenCalledTimes( 2 );
	await succeed( 1, 102 );
	expect( mockUploader ).toHaveBeenCalledTimes( 3 );
	await succeed( 2 );
	expect( mockFetch ).toHaveBeenLastCalledWith(
		expect.objectContaining( { data: { id: 101, title: 'Retained' } } )
	);
} );

it.each( [ 'missing', 'rejected' ] )(
	'handles a %s token without stranding the queue',
	async kind => {
		if ( kind === 'missing' ) {
			mockToken.mockResolvedValueOnce( {} as never );
		} else {
			mockToken.mockRejectedValueOnce( new Error( 'Offline' ) );
		}
		const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
		const id = await start( result );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'failed' );
		await act( async () => result.current.retryUpload( id ) );
		expect( mockUploader ).toHaveBeenCalledTimes( 1 );
		expect( result.current.uploadQueue[ 0 ].error ).toBeUndefined();
	}
);

it( 'synchronizes chapters only after the description is saved', async () => {
	mockFetch.mockResolvedValue( {
		id: 101,
		title: { rendered: 'Video' },
		description: { rendered: '' },
		media_details: {},
		jetpack_videopress: { guid: 'abc123' },
	} );
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const id = await start( result );
	act( () => result.current.saveUploadDetails( id, { description: '0:00 Intro' } ) );
	expect( syncChapters ).not.toHaveBeenCalled();
	await succeed();
	expect( syncChapters ).toHaveBeenCalledWith(
		expect.objectContaining( { guid: 'abc123' } ),
		'0:00 Intro',
		expect.anything()
	);
} );

it( 'releases finished files after the library refresh but retains the temporary route mapping', async () => {
	jest.useFakeTimers();
	try {
		const client = createTestQueryClient();
		let finishRefetch: () => void;
		jest.spyOn( client, 'invalidateQueries' ).mockReturnValue(
			new Promise( resolve => {
				finishRefetch = resolve;
			} )
		);
		const { result } = renderHook( useUpload, { wrapper: createTestWrapper( client ) } );
		const id = await start( result );
		await succeed();
		act( () => jest.runOnlyPendingTimers() );
		expect( result.current.uploadQueue ).toHaveLength( 1 );
		await act( async () => {
			finishRefetch!();
		} );
		act( () => jest.runOnlyPendingTimers() );
		expect( result.current.uploadQueue ).toHaveLength( 0 );
		expect( result.current.completedUploads[ id ] ).toBe( '101' );
		expect( mockFetch ).not.toHaveBeenCalled();
	} finally {
		jest.useRealTimers();
	}
} );

it( 'ignores late progress and duplicate completion callbacks', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	await start( result );
	await start( result );
	await succeed();
	await succeed();
	act( () => callbacks().onProgress( 1, 10 ) );
	expect( result.current.uploadQueue[ 0 ].status ).toBe( 'success' );
	expect( result.current.uploadQueue[ 1 ].status ).toBe( 'pending' );
	expect( mockUploader ).toHaveBeenCalledTimes( 2 );
} );

it( 'ignores callbacks from a failed attempt after the same upload is retried', async () => {
	const { result } = renderHook( useUpload, { wrapper: createTestWrapper() } );
	const id = await start( result );
	await act( async () => callbacks().onError( new Error( 'Offline' ) ) );
	await act( async () => result.current.retryUpload( id ) );
	act( () => {
		callbacks().onProgress( 10, 10 );
		callbacks().onSuccess( media, file() );
	} );
	expect( result.current.uploadQueue[ 0 ].status ).toBe( 'pending' );
	expect( result.current.completedUploads[ id ] ).toBeUndefined();
	await succeed( 1 );
	expect( result.current.completedUploads[ id ] ).toBe( '101' );
} );
