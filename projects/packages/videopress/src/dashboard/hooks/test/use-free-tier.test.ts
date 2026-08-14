import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useFreeTier } from '../use-free-tier';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWoASite: jest.fn( () => false ),
	// These suites run in self-hosted mode; Simple-mode suites use the real
	// module with the JetpackScriptData global via test-utils/simple-site.
	isSimpleSite: jest.fn( () => false ),
} ) );

let mockUploadQueue: Array< Record< string, unknown > > = [];
jest.mock( '../use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockUploadQueue,
		startUpload: jest.fn(),
		retryUpload: jest.fn(),
	} ),
} ) );

const queueRow = ( status: string ) => ( {
	id: `q-${ status }`,
	status,
	progress: status === 'success' ? 1 : 0.5,
	file: new File( [], 'a' ),
	enqueuedAt: '2026-08-13T10:00:00.000Z',
} );

/**
 * Answer the library count request with a zero total — the free-tier hook's
 * only network read.
 *
 * @param total - The X-WP-Total the listing should report.
 */
function mockLibraryTotal( total: string ) {
	mockApiFetch( async ( { parse } ) => {
		if ( parse === false ) {
			return {
				headers: { get: ( key: string ) => ( key === 'X-WP-Total' ? total : '0' ) },
				json: async () => [],
			};
		}
		throw new Error( 'unexpected parsed request' );
	} );
}

describe( 'useFreeTier', () => {
	beforeAll( () => {
		( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = {
			siteData: { hasVideoPressAccess: false, isVideoPressUnlimited: false },
		};
	} );

	beforeEach( () => {
		mockUploadQueue = [ queueRow( 'uploading' ) ];
	} );

	// Regression: only `uploading|pending` were counted, so the gate reopened
	// the instant an upload succeeded — before the library refetch (and the
	// `type=videopress` registration behind it) caught up — and a free user
	// could start a second upload in that window.
	it( 'keeps counting a succeeded upload until its row is acknowledged', async () => {
		mockUploadQueue = [ queueRow( 'success' ) ];
		mockLibraryTotal( '0' );

		const { result } = renderHook( () => useFreeTier(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.videoCount ).toBe( 1 ) );
		expect( result.current.isAtLimit ).toBe( true );
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
			// No other endpoints are fetched by this hook anymore.
			throw new Error( 'unexpected parsed request' );
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
			throw new Error( 'unexpected parsed request' );
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
