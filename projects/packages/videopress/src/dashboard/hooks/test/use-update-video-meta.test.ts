import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useUpdateVideoMeta, patchToApi } from '../use-update-video-meta';

describe( 'patchToApi', () => {
	it( 'maps UI fields to wpcom/v2/videopress/meta shape', () => {
		expect(
			patchToApi( {
				title: 'New',
				description: 'd',
				rating: 'PG-13',
				privacy: 'private',
				displayEmbed: true,
				allowDownloads: false,
			} )
		).toEqual( {
			title: 'New',
			description: 'd',
			rating: 'PG-13',
			privacy_setting: 1,
			display_embed: true,
			allow_download: false,
		} );
	} );

	it( 'omits keys not in the patch', () => {
		expect( patchToApi( { title: 'Only' } ) ).toEqual( { title: 'Only' } );
	} );
} );

describe( 'useUpdateVideoMeta', () => {
	it( 'POSTs to wpcom/v2/videopress/meta with id and the converted patch', async () => {
		let capturedData: unknown;
		mockApiFetch( async ( { path, method, data } ) => {
			if ( path === '/wpcom/v2/videopress/meta' && method === 'POST' ) {
				capturedData = data;
				return { code: 'success', message: 'ok', data: 200 };
			}
			throw new Error( `unexpected: ${ path } ${ method }` );
		} );

		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useUpdateVideoMeta(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( {
				id: 42,
				patch: { title: 'X', displayEmbed: true },
			} );
		} );

		expect( capturedData ).toEqual( { id: 42, title: 'X', display_embed: true } );
	} );
} );
