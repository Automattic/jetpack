import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import { LIBRARY_QUERY_KEY } from '../use-library';
import {
	promoteOnSimple,
	uploadFromLibrary,
	useUploadFromLibrary,
} from '../use-upload-from-library';

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

		// A real (1ms) delay so the between-poll sleep path runs too.
		await expect( uploadFromLibrary( 1, { delayMs: 1 } ) ).resolves.toEqual( {
			guid: 'g',
			mediaId: 9,
		} );
		expect( i ).toBe( 3 );
	} );

	it( 'reports the upload percentage after each chunk response', async () => {
		const responses = [
			{ status: 'new' as const, bytes_uploaded: 0, file_size: 200 },
			{ status: 'uploading' as const, bytes_uploaded: 100, file_size: 200 },
			{
				status: 'complete' as const,
				bytes_uploaded: 200,
				file_size: 200,
				uploaded_details: { guid: 'g', media_id: 9 },
			},
		];
		let i = 0;
		mockApiFetch( async () => responses[ i++ ] );
		const onProgress = jest.fn();

		await uploadFromLibrary( 1, { delayMs: 0, onProgress } );

		expect( onProgress.mock.calls.map( ( [ percent ] ) => percent ) ).toEqual( [ 0, 50, 100 ] );
	} );

	it( 'skips progress reporting when the response lacks byte counts', async () => {
		const responses = [
			{ status: 'uploading' as const },
			{ status: 'complete' as const, uploaded_details: { guid: 'g', media_id: 9 } },
		];
		let i = 0;
		mockApiFetch( async () => responses[ i++ ] );
		const onProgress = jest.fn();

		await uploadFromLibrary( 1, { delayMs: 0, onProgress } );

		expect( onProgress ).not.toHaveBeenCalled();
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

	it( 'falls back to a generic message when the error status has no detail', async () => {
		mockApiFetch( async () => ( { status: 'error' } ) );

		await expect( uploadFromLibrary( 1, { delayMs: 0 } ) ).rejects.toThrow(
			'Unexpected upload status.'
		);
	} );
} );

describe( 'promoteOnSimple', () => {
	it( 'POSTs the wpcom/v2 promote route once and maps the response', async () => {
		const paths: ( string | undefined )[] = [];
		mockApiFetch( async ( { path, method } ) => {
			paths.push( path );
			expect( method ).toBe( 'POST' );
			// `already_videopress` (the idempotent-replay marker) is unread
			// by the mapper — same result shape either way.
			return { guid: 'AbCd1234', media_id: 5, already_videopress: true };
		} );

		await expect( promoteOnSimple( 5 ) ).resolves.toEqual( { guid: 'AbCd1234', mediaId: 5 } );
		expect( paths ).toEqual( [ '/wpcom/v2/videopress/promote/5' ] );
	} );

	it( 'rejects with an Error carrying the REST payload message', async () => {
		mockApiFetch( async () => {
			throw { code: 'videopress_promote_not_allowed', message: 'No VideoPress here.' };
		} );

		const rejection = promoteOnSimple( 5 );
		await expect( rejection ).rejects.toBeInstanceOf( Error );
		await expect( rejection ).rejects.toMatchObject( { message: 'No VideoPress here.' } );
	} );

	it( 'rethrows a rejection that is already an Error untouched', async () => {
		const original = new Error( 'network down' );
		mockApiFetch( async () => {
			throw original;
		} );

		await expect( promoteOnSimple( 5 ) ).rejects.toBe( original );
	} );

	it( 'normalizes a messageless rejection into the generic Error', async () => {
		mockApiFetch( async () => {
			throw { code: 'mystery' };
		} );

		await expect( promoteOnSimple( 5 ) ).rejects.toThrow(
			'Failed to promote video to VideoPress.'
		);
	} );
} );

describe( 'useUploadFromLibrary', () => {
	afterEach( () => {
		unsetSimpleSite();
	} );

	it( 'routes through the one-shot wpcom/v2 promote on Simple (no walker)', async () => {
		setSimpleSite();
		const paths: ( string | undefined )[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path );
			return { guid: 'g1234567', media_id: 3 };
		} );

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useUploadFromLibrary(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( { id: 3 } );
		} );

		expect( outcome ).toEqual( { guid: 'g1234567', mediaId: 3 } );
		expect( paths ).toEqual( [ '/wpcom/v2/videopress/promote/3' ] );
		// The listing only learns about the in-place promotion through this
		// invalidation — nothing else refetches while no item is processing.
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ LIBRARY_QUERY_KEY ] } );
	} );

	it( 'keeps walking the videopress/v1 upload endpoint off Simple', async () => {
		const paths: ( string | undefined )[] = [];
		mockApiFetch( async ( { path } ) => {
			paths.push( path );
			return { status: 'complete', uploaded_details: { guid: 'g', media_id: 3 } };
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useUploadFromLibrary(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( { id: 3 } );
		} );

		expect( paths ).toEqual( [ '/videopress/v1/upload/3' ] );
	} );
} );
