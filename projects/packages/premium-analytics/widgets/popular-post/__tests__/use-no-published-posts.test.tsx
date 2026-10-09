/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { queryClientWrapper } from '../../test-utils';
import { useNoPublishedPosts } from '../../use-no-published-posts';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = jest.mocked( apiFetch );

beforeEach( () => {
	queryClient.clear();
	mockApiFetch.mockReset();
} );

it( 'shares one published-post request between empty widgets', async () => {
	mockApiFetch.mockResolvedValue( [] );

	const { result: firstResult } = renderHook( () => useNoPublishedPosts( true ), {
		wrapper: queryClientWrapper,
	} );
	const { result: secondResult } = renderHook( () => useNoPublishedPosts( true ), {
		wrapper: queryClientWrapper,
	} );

	await waitFor( () => expect( firstResult.current ).toBe( true ) );
	await waitFor( () => expect( secondResult.current ).toBe( true ) );
	expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
} );

it( 'stops claiming no posts when a refresh fails after a cached empty result', async () => {
	mockApiFetch.mockResolvedValueOnce( [] );
	const { result } = renderHook( () => useNoPublishedPosts( true ), {
		wrapper: queryClientWrapper,
	} );
	await waitFor( () => expect( result.current ).toBe( true ) );

	mockApiFetch.mockRejectedValueOnce( { code: 'rest_forbidden', data: { status: 403 } } );
	await act( () => queryClient.refetchQueries( { queryKey: [ 'latest-post' ] } ) );

	await waitFor( () =>
		expect( queryClient.getQueryState( [ 'latest-post' ] )?.status ).toBe( 'error' )
	);
	expect( result.current ).toBe( false );
} );
