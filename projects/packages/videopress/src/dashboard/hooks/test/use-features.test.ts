import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import { useFeatures } from '../use-features';

describe( 'useFeatures', () => {
	it( 'fetches videopress/v1/features and returns the feature flags', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path === '/videopress/v1/features' ) {
				return {
					isVideoPressSupported: true,
					isVideoPress1TBSupported: true,
					isVideoPressUnlimitedSupported: false,
				};
			}
			throw new Error( `unexpected path: ${ path }` );
		} );

		const { result } = renderHook( () => useFeatures(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		expect( result.current.data ).toEqual( {
			isVideoPressSupported: true,
			isVideoPress1TBSupported: true,
			isVideoPressUnlimitedSupported: false,
		} );
	} );

	it( 'surfaces errors via the error state', async () => {
		mockApiFetch( async () => {
			throw new Error( 'forbidden' );
		} );

		const { result } = renderHook( () => useFeatures(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
	} );

	it( 'never fetches on WordPress.com Simple (videopress/v1 is unmappable there)', async () => {
		setSimpleSite();
		try {
			const fetchMock = mockApiFetch( async () => {
				throw new Error( 'should not be called' );
			} );

			const { result } = renderHook( () => useFeatures(), { wrapper: createTestWrapper() } );

			// Give a queued fetch a chance to fire before asserting it never did.
			await new Promise( resolve => setTimeout( resolve, 0 ) );
			expect( fetchMock ).not.toHaveBeenCalled();
			expect( result.current.data ).toBeUndefined();
			expect( result.current.isError ).toBe( false );
		} finally {
			unsetSimpleSite();
		}
	} );
} );
