import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
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
} );
