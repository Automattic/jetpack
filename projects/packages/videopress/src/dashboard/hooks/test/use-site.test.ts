import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
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
