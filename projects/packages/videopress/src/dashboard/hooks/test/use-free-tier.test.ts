import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
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

	// Regression: an unlimited (grandfathered) plan must never be reported as
	// at the limit, even when the counted videos reach the free-tier cap.
	// `isFree` and `isUnlimited` come from independent signals, so `isAtLimit`
	// must explicitly exclude unlimited.
	it( 'is not at the limit on an unlimited plan even at the nominal cap', async () => {
		const win = window as unknown as {
			JPVIDEOPRESS_INITIAL_STATE: { siteData: unknown };
		};
		const previousSiteData = win.JPVIDEOPRESS_INITIAL_STATE.siteData;
		win.JPVIDEOPRESS_INITIAL_STATE.siteData = {
			hasVideoPressAccess: false,
			isVideoPressUnlimited: true,
		};

		mockApiFetch( async ( { parse } ) => {
			if ( parse === false ) {
				return {
					headers: { get: ( key: string ) => ( key === 'X-WP-Total' ? '0' : '0' ) },
					json: async () => [],
				};
			}
			return {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			};
		} );

		try {
			const { result } = renderHook( () => useFreeTier(), { wrapper: createTestWrapper() } );
			// 0 completed + 1 in-flight = 1, which equals the free-tier cap…
			await waitFor( () => expect( result.current.videoCount ).toBe( 1 ) );
			expect( result.current.isUnlimited ).toBe( true );
			// …but an unlimited plan is never gated.
			expect( result.current.isAtLimit ).toBe( false );
		} finally {
			win.JPVIDEOPRESS_INITIAL_STATE.siteData = previousSiteData;
		}
	} );

	// Regression: the listing call that drives the free-tier count must
	// restrict to VideoPress-hosted videos (`mime_type=video/videopress`).
	// Without the filter, local video attachments were counted toward the
	// free-tier upload cap and falsely gated a free user's first upload.
	it( 'counts only VideoPress-hosted videos, not local attachments', async () => {
		mockApiFetch( async ( { parse } ) => {
			if ( parse === false ) {
				return {
					headers: {
						get: ( key: string ) => ( key === 'X-WP-Total' ? '0' : '0' ),
					},
					json: async () => [],
				};
			}
			return {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			};
		} );

		renderHook( () => useFreeTier(), { wrapper: createTestWrapper() } );

		await waitFor( () => {
			const calls = getApiFetchMock().mock.calls.map(
				( [ args ] ) => ( args as { path?: string } )?.path ?? ''
			);
			expect( calls.some( path => path.includes( '/wp/v2/media' ) ) ).toBe( true );
		} );

		const mediaPaths = getApiFetchMock()
			.mock.calls.map( ( [ args ] ) => ( args as { path?: string } )?.path ?? '' )
			.filter( path => path.includes( '/wp/v2/media' ) );
		expect( mediaPaths.length ).toBeGreaterThan( 0 );
		for ( const path of mediaPaths ) {
			expect( path ).toContain( 'mime_type=video%2Fvideopress' );
			expect( path ).not.toContain( 'media_type=video' );
		}
	} );
} );
