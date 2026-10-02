import { act, renderHook } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useRetryVideoProcessing } from '../use-retry-video-processing';
import { EDITS_QUERY_KEY } from '../use-video-edits';

it( 'retries the failed job on the same video and immediately locks its cached state', async () => {
	const client = createTestQueryClient();
	client.setQueryDefaults( [ EDITS_QUERY_KEY ], { gcTime: Infinity } );
	const processing = { id: '456', status: 'processing' };
	const original = {
		guid: 'AbCd1234',
		revision: 0,
		operations: [],
		can_retry: true,
		job: { id: '123', status: 'failed' },
	};
	client.setQueryData( [ EDITS_QUERY_KEY, original.guid ], original );
	const fetch = mockApiFetch( async () => ( {
		guid: original.guid,
		revision: 0,
		job: processing,
	} ) );
	const { result } = renderHook( useRetryVideoProcessing, {
		wrapper: createTestWrapper( client ),
	} );
	await act( async () => {
		await result.current.mutateAsync( { guid: original.guid, jobId: '123' } );
	} );
	expect( fetch ).toHaveBeenCalledWith( {
		path: '/wpcom/v2/videopress/AbCd1234/edits/retry',
		method: 'POST',
		data: { job_id: '123' },
	} );
	expect( client.getQueryData( [ EDITS_QUERY_KEY, original.guid ] ) ).toEqual( {
		...original,
		can_retry: false,
		job: processing,
	} );
} );

it( 'leaves the failure state unchanged when the retry is rejected', async () => {
	const client = createTestQueryClient();
	client.setQueryDefaults( [ EDITS_QUERY_KEY ], { gcTime: Infinity } );
	const original = { guid: 'AbCd1234', job: { id: '123', status: 'failed' } };
	client.setQueryData( [ EDITS_QUERY_KEY, original.guid ], original );
	const error = new Error( 'Superseded' );
	mockApiFetch( async () => {
		throw error;
	} );
	const { result } = renderHook( useRetryVideoProcessing, {
		wrapper: createTestWrapper( client ),
	} );
	await act( async () => {
		await expect(
			result.current.mutateAsync( { guid: original.guid, jobId: '123' } )
		).rejects.toThrow( error );
	} );
	expect( client.getQueryData( [ EDITS_QUERY_KEY, original.guid ] ) ).toEqual( original );
} );
