import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useSetPrivacy } from '../use-set-privacy';

describe( 'useSetPrivacy', () => {
	it( 'POSTs the mapped privacy_setting for each id', async () => {
		const requests: { id: number; privacy_setting: number }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			if ( method === 'POST' && path === '/wpcom/v2/videopress/meta' ) {
				requests.push( data as { id: number; privacy_setting: number } );
				return { code: 'success' };
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPrivacy(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( { ids: [ 1, 2 ], privacy: 'private' } );
		} );

		expect( requests ).toEqual( [
			{ id: 1, privacy_setting: 1 },
			{ id: 2, privacy_setting: 1 },
		] );
		expect( outcome ).toEqual( { succeeded: [ 1, 2 ], failed: [] } );
	} );

	it( 'reports partial failures without aborting the batch', async () => {
		mockApiFetch( async ( { method, data } ) => {
			if ( method === 'POST' ) {
				const { id } = data as { id: number };
				if ( id === 2 ) {
					throw new Error( 'nope' );
				}
				return { code: 'success' };
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPrivacy(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( { ids: [ 1, 2, 3 ], privacy: 'public' } );
		} );

		expect( outcome ).toEqual( {
			succeeded: [ 1, 3 ],
			failed: [ { id: 2, message: 'nope' } ],
		} );
	} );
} );
