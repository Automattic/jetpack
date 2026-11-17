import apiFetch from '@wordpress/api-fetch';
import { uploadFromLibrary } from '../use-uploader';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'uploadFromLibrary', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'preserves the explicit source through every resumed upload chunk', async () => {
		apiFetch
			.mockResolvedValueOnce( { status: 'new' } )
			.mockResolvedValueOnce( { status: 'resume' } )
			.mockResolvedValueOnce( { status: 'uploading' } )
			.mockResolvedValueOnce( {
				status: 'complete',
				uploaded_details: { guid: 'Abcd1234', media_id: 9, upload_src: 'video.mp4' },
			} );

		await expect( uploadFromLibrary( 1, 'block_editor' ) ).resolves.toEqual( {
			guid: 'Abcd1234',
			id: 9,
			src: 'video.mp4',
		} );
		expect( apiFetch.mock.calls ).toEqual(
			Array( 4 ).fill( [
				{ path: 'videopress/v1/upload/1', method: 'POST', data: { source: 'block_editor' } },
			] )
		);
	} );

	it( 'keeps callers without an explicit source unlabeled', async () => {
		apiFetch.mockResolvedValue( {
			status: 'complete',
			uploaded_details: { guid: 'Abcd1234', media_id: 9 },
		} );

		await uploadFromLibrary( 1 );

		expect( apiFetch ).toHaveBeenCalledWith( { path: 'videopress/v1/upload/1', method: 'POST' } );
	} );
} );
