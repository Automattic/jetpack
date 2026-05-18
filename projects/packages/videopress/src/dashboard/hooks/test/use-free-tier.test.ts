import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useFreeTier } from '../use-free-tier';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWoASite: jest.fn( () => false ),
} ) );

jest.mock( '../use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: [ { id: 'a', status: 'uploading', progress: 0.5, file: new File( [], 'a' ) } ],
		startUpload: jest.fn(),
		retryUpload: jest.fn(),
	} ),
} ) );

describe( 'useFreeTier', () => {
	beforeAll( () => {
		( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = {
			siteData: { hasVideoPressAccess: false, isVideoPressUnlimited: false },
		};
	} );

	it( 'counts completed (from totalItems) + in-flight uploads', async () => {
		mockApiFetch( async ( { parse } ) => {
			if ( parse === false ) {
				return {
					headers: {
						get: ( key: string ) => ( key === 'X-WP-Total' ? '0' : '0' ),
					},
					json: async () => [],
				};
			}
			// /videopress/v1/features default response
			return {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			};
		} );

		const { result } = renderHook( () => useFreeTier(), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.videoCount ).toBeGreaterThanOrEqual( 1 ) );
		// 0 completed (server total) + 1 in-flight = 1; free tier limit = 1 → at limit
		expect( result.current.videoCount ).toBe( 1 );
		expect( result.current.isAtLimit ).toBe( true );
	} );
} );
