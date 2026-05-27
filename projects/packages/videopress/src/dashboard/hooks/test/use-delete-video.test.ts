import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useDeleteVideo } from '../use-delete-video';

describe( 'useDeleteVideo', () => {
	it( 'sends DELETE for each id', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path, method } ) => {
			if ( method === 'DELETE' ) {
				paths.push( path ?? '' );
				return { deleted: true };
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( [ 1, 2, 3 ] );
		} );

		expect( paths ).toEqual( [
			'/wp/v2/media/1?force=true',
			'/wp/v2/media/2?force=true',
			'/wp/v2/media/3?force=true',
		] );
	} );
} );
