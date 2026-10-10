// Integration test that exercises useFreeTier *together with* a real
// useUpload instance — not the mocked one used by use-free-tier.test.ts.
//
// This is the regression test for the bug where useFreeTier called
// useUpload() in isolation and never saw the uploads kicked off by a
// separate useUpload() instance in Library Stage. The fix moves the
// queue to a shared window-attached store so any consumer sees the
// same items.

import { renderHook, act, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useFreeTier } from '../use-free-tier';
import { useUpload } from '../use-upload';

const mockUploadHandler = jest.fn();
const resetUploadStore = () => {
	delete window.__jetpackVideopressUploadStore;
};

jest.mock( '../../../client/lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn( async () => ( { token: 'token' } ) ),
} ) );
jest.mock( '../../../client/lib/resumable-file-uploader', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUploadHandler( ...args ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWoASite: jest.fn( () => false ),
	// These suites run in self-hosted mode; Simple-mode suites use the real
	// module with the JetpackScriptData global via test-utils/simple-site.
	isSimpleSite: jest.fn( () => false ),
} ) );

beforeAll( () => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = {
		siteData: { hasVideoPressAccess: false, isVideoPressUnlimited: false },
	};
} );

beforeEach( () => {
	mockUploadHandler.mockClear();
	resetUploadStore();
} );

describe( 'useFreeTier + useUpload integration', () => {
	it( 'observes an in-flight upload kicked off by a separate useUpload instance', async () => {
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

		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );

		// Mount the observer first to mirror the real wiring (Overview or
		// Library Stage renders useFreeTier alongside useUpload).
		const { result: freeTier } = renderHook( () => useFreeTier(), { wrapper } );
		const { result: uploader } = renderHook( () => useUpload(), { wrapper } );

		// Wait until the free-tier query has settled with 0 server videos.
		await waitFor( () => expect( freeTier.current.videoCount ).toBe( 0 ) );
		expect( freeTier.current.isAtLimit ).toBe( false );

		act( () => {
			uploader.current.startUpload( new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } ) );
		} );

		// 0 completed (server) + 1 in-flight (shared queue) = 1; free tier
		// limit = 1 → at limit. The observer instance sees the upload via
		// the shared window store.
		await waitFor( () => expect( freeTier.current.videoCount ).toBe( 1 ) );
		expect( freeTier.current.isAtLimit ).toBe( true );
	} );
} );
