import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import { useSite, getStorageUsedBytes } from '../use-site';

describe( 'useSite', () => {
	it( 'fetches videopress/v1/site', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path === '/videopress/v1/site' ) {
				return { options: { videopress_storage_used: 250, is_wpcom_atomic: false } };
			}
			throw new Error( `unexpected path: ${ path }` );
		} );

		const { result } = renderHook( () => useSite(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		expect( result.current.data?.options?.videopress_storage_used ).toBe( 250 );
	} );

	it( 'never fetches on WordPress.com Simple (videopress/v1 is unmappable there)', async () => {
		setSimpleSite();
		try {
			const fetchMock = mockApiFetch( async () => {
				throw new Error( 'should not be called' );
			} );

			const { result } = renderHook( () => useSite(), { wrapper: createTestWrapper() } );

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

describe( 'getStorageUsedBytes', () => {
	it( 'converts decimal megabytes to bytes (× 1_000_000)', () => {
		expect( getStorageUsedBytes( { options: { videopress_storage_used: 250 } } ) ).toBe(
			250_000_000
		);
	} );

	it( 'returns 0 when the field is missing', () => {
		expect( getStorageUsedBytes( undefined ) ).toBe( 0 );
		expect( getStorageUsedBytes( { options: {} } ) ).toBe( 0 );
	} );
} );
