import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { uploadFromLibrary } from '../use-upload-from-library';

describe( 'uploadFromLibrary', () => {
	it( 'returns guid + mediaId immediately when the first response is complete', async () => {
		mockApiFetch( async () => ( {
			status: 'complete',
			uploaded_details: { guid: 'g', media_id: 42 },
		} ) );

		await expect( uploadFromLibrary( 1, { delayMs: 0 } ) ).resolves.toEqual( {
			guid: 'g',
			mediaId: 42,
		} );
	} );

	it( 'recognises the "uploaded" terminal status (zombie row safety net)', async () => {
		mockApiFetch( async () => ( {
			status: 'uploaded',
			uploaded_video_guid: 'zg',
			uploaded_post_id: 7,
		} ) );

		await expect( uploadFromLibrary( 1, { delayMs: 0 } ) ).resolves.toEqual( {
			guid: 'zg',
			mediaId: 7,
		} );
	} );

	it( 'polls through new/uploading until complete', async () => {
		const responses = [
			{ status: 'new' as const },
			{ status: 'uploading' as const },
			{
				status: 'complete' as const,
				uploaded_details: { guid: 'g', media_id: 9 },
			},
		];
		let i = 0;
		mockApiFetch( async () => responses[ i++ ] );

		await expect( uploadFromLibrary( 1, { delayMs: 0 } ) ).resolves.toEqual( {
			guid: 'g',
			mediaId: 9,
		} );
		expect( i ).toBe( 3 );
	} );

	it( 'throws after exceeding the max poll attempts', async () => {
		mockApiFetch( async () => ( { status: 'uploading' } ) );

		await expect( uploadFromLibrary( 1, { delayMs: 0, maxAttempts: 3 } ) ).rejects.toThrow(
			/timed out/i
		);
	} );

	it( 'tolerates a transient apiFetch failure and keeps polling', async () => {
		let calls = 0;
		mockApiFetch( async () => {
			calls += 1;
			if ( calls === 1 ) {
				throw new Error( 'network blip' );
			}
			return {
				status: 'complete',
				uploaded_details: { guid: 'g', media_id: 1 },
			};
		} );

		await expect( uploadFromLibrary( 1, { delayMs: 0 } ) ).resolves.toEqual( {
			guid: 'g',
			mediaId: 1,
		} );
		expect( calls ).toBe( 2 );
	} );

	it( 'gives up after consecutive transient failures exceed maxAttempts', async () => {
		mockApiFetch( async () => {
			throw new Error( 'down' );
		} );

		await expect( uploadFromLibrary( 1, { delayMs: 0, maxAttempts: 3 } ) ).rejects.toThrow();
	} );

	it( 'rethrows the explicit error status from the endpoint', async () => {
		mockApiFetch( async () => ( {
			status: 'error',
			error: '403: Invalid Mime',
		} ) );

		await expect( uploadFromLibrary( 1, { delayMs: 0 } ) ).rejects.toThrow( '403: Invalid Mime' );
	} );
} );
