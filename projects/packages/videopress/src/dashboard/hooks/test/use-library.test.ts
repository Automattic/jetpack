import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useLibrary, viewToQueryArgs, privacyStringToInt } from '../use-library';
import type { View } from '@wordpress/dataviews';

const DEFAULT_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 12,
	fields: [],
	sort: { field: 'uploadDate', direction: 'desc' },
	filters: [],
	search: '',
};

describe( 'privacyStringToInt', () => {
	it( 'maps UI privacy strings to WPCOM integer codes', () => {
		expect( privacyStringToInt( 'public' ) ).toBe( 0 );
		expect( privacyStringToInt( 'private' ) ).toBe( 1 );
		expect( privacyStringToInt( 'site-default' ) ).toBe( 2 );
	} );
} );

describe( 'viewToQueryArgs', () => {
	it( 'maps the default view to core media query args', () => {
		expect( viewToQueryArgs( DEFAULT_VIEW ) ).toEqual( {
			media_type: 'video',
			mime_type: 'video/*',
			page: 1,
			per_page: 12,
			orderby: 'date',
			order: 'desc',
			videopress_hide_already_uploaded: 1,
		} );
	} );

	it( 'maps title sort to orderby=title', () => {
		expect(
			viewToQueryArgs( { ...DEFAULT_VIEW, sort: { field: 'title', direction: 'asc' } } )
		).toMatchObject( { orderby: 'title', order: 'asc' } );
	} );

	it( 'drops unsupported sort fields (duration, fileSize) so WPCOM uses its default', () => {
		expect(
			viewToQueryArgs( { ...DEFAULT_VIEW, sort: { field: 'duration', direction: 'asc' } } )
		).not.toHaveProperty( 'orderby' );
		expect(
			viewToQueryArgs( { ...DEFAULT_VIEW, sort: { field: 'fileSize', direction: 'asc' } } )
		).not.toHaveProperty( 'orderby' );
	} );

	it( 'maps privacy filter to videopress_privacy_setting integer', () => {
		expect(
			viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			} )
		).toMatchObject( { videopress_privacy_setting: '1' } );
	} );

	it( 'maps search to the search param', () => {
		expect( viewToQueryArgs( { ...DEFAULT_VIEW, search: 'foo' } ) ).toMatchObject( {
			search: 'foo',
		} );
	} );
} );

describe( 'useLibrary', () => {
	it( 'returns items and paginationInfo derived from response headers', async () => {
		const body = JSON.stringify( [
			{
				id: 42,
				title: { rendered: 'Test video' },
				source_url: 'https://example.com/v.mp4',
				media_details: { length: 120, filesize: 12_345_678 },
				date: '2026-05-15T10:00:00',
				jetpack_videopress: {
					guid: 'abc',
					rating: 'G',
					display_embed: 1,
					allow_download: 0,
					privacy_setting: 0,
				},
			},
		] );
		const responseHeaders: Record< string, string > = {
			'X-WP-Total': '1',
			'X-WP-TotalPages': '1',
			'Content-Type': 'application/json',
		};
		mockApiFetch( async () => ( {
			headers: { get: ( name: string ) => responseHeaders[ name ] ?? null },
			json: async () => JSON.parse( body ),
		} ) );

		const { result } = renderHook( () => useLibrary( DEFAULT_VIEW ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.items.length ).toBeGreaterThan( 0 ) );
		expect( result.current.items[ 0 ].title ).toBe( 'Test video' );
		// The media REST field doesn't return `tracks`; items default to [].
		expect( result.current.items[ 0 ].tracks ).toEqual( [] );
		expect( result.current.paginationInfo.totalItems ).toBe( 1 );
		expect( result.current.paginationInfo.totalPages ).toBe( 1 );
	} );
} );
