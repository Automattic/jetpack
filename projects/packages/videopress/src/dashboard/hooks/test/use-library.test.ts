import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useLibrary, viewToQueryArgs, privacyStringToInt, applyImportDraft } from '../use-library';
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

	it( 'maps a playlists filter to the videopress-playlists term arg', () => {
		expect(
			viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'playlists', operator: 'is', value: 7 } ],
			} )
		).toMatchObject( { 'videopress-playlists': 7 } );
	} );

	it( 'coerces a stringified playlists filter value and drops non-numeric ones', () => {
		expect(
			viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'playlists', operator: 'is', value: '7' } ],
			} )
		).toMatchObject( { 'videopress-playlists': 7 } );
		expect(
			viewToQueryArgs( {
				...DEFAULT_VIEW,
				filters: [ { field: 'playlists', operator: 'is', value: 'bogus' } ],
			} )
		).not.toHaveProperty( 'videopress-playlists' );
	} );

	it( 'maps search to the search param', () => {
		expect( viewToQueryArgs( { ...DEFAULT_VIEW, search: 'foo' } ) ).toMatchObject( {
			search: 'foo',
		} );
	} );
} );

describe( 'applyImportDraft', () => {
	const mapped = () => ( {
		id: '77',
		guid: '',
		type: 'local' as const,
		title: 'Placeholder post title',
		filename: '',
		thumbnailUrl: null,
		durationSeconds: 0,
		uploadDate: '2026-06-01T00:00:00',
		privacy: 'site-default' as const,
		isPrivate: false,
		fileSizeBytes: 0,
		upload: { status: 'idle' as const, progress: 0 },
		description: '',
		rating: 'G' as const,
		displayEmbed: false,
		allowDownloads: false,
		shortcode: '',
		isProcessing: false,
		playlistIds: [],
	} );

	it( 'converts an awaiting_media item to a draft with import-sourced fields', () => {
		const draft = applyImportDraft(
			{
				source: 'youtube',
				external_id: 'k3xPn0qLmA1',
				title: 'Packing for the Andes',
				description: 'Every item I carry.',
				duration_seconds: 1245,
				thumbnail_url: 'https://example.com/wp-content/uploads/thumb-1024x576.jpg',
				thumbnail_attachment_id: 9,
				status: 'awaiting_media',
			},
			mapped()
		);

		expect( draft.type ).toBe( 'draft' );
		expect( draft.title ).toBe( 'Packing for the Andes' );
		expect( draft.description ).toBe( 'Every item I carry.' );
		expect( draft.durationSeconds ).toBe( 1245 );
		expect( draft.thumbnailUrl ).toBe(
			'https://example.com/wp-content/uploads/thumb-1024x576.jpg'
		);
		// No guid: drafts must stay out of every VideoPress-only flow.
		expect( draft.guid ).toBe( '' );
	} );

	it( 'nulls the thumbnail when the import kept no usable URL', () => {
		const draft = applyImportDraft(
			{ title: 'T', status: 'awaiting_media', thumbnail_url: '' },
			mapped()
		);
		expect( draft.thumbnailUrl ).toBeNull();
	} );

	it( 'maps the imported privacy (unlisted → private) onto the draft row', () => {
		expect(
			applyImportDraft( { status: 'awaiting_media', privacy: 'unlisted' }, mapped() ).privacy
		).toBe( 'private' );
		expect(
			applyImportDraft( { status: 'awaiting_media', privacy: 'public' }, mapped() ).privacy
		).toBe( 'public' );
		// Unknown or absent values keep the item's default rather than
		// inventing a privacy the attach flow won't apply.
		expect( applyImportDraft( { status: 'awaiting_media' }, mapped() ).privacy ).toBe(
			'site-default'
		);
	} );

	it( 'leaves items without awaiting_media import meta untouched', () => {
		const item = mapped();
		expect( applyImportDraft( undefined, item ) ).toBe( item );
		expect( applyImportDraft( { title: 'Done', status: 'completed' }, item ) ).toBe( item );
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
		expect( result.current.paginationInfo.totalItems ).toBe( 1 );
		expect( result.current.paginationInfo.totalPages ).toBe( 1 );
	} );

	it( 'maps an import placeholder response to a draft item', async () => {
		const body = JSON.stringify( [
			{
				id: 51,
				title: { rendered: 'Sunrise Timelapse' },
				mime_type: 'video/videopress-draft',
				jetpack_videopress_import: {
					source: 'youtube',
					external_id: 'Zt8vWy2RbQ4',
					title: 'Sunrise Timelapse Over Lake Titicaca (4K)',
					description: 'Three hours compressed into three minutes.',
					duration_seconds: 187,
					thumbnail_url: 'https://i.ytimg.com/vi/Zt8vWy2RbQ4/hqdefault.jpg',
					thumbnail_attachment_id: 0,
					status: 'awaiting_media',
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
		const [ draft ] = result.current.items;
		expect( draft.type ).toBe( 'draft' );
		expect( draft.title ).toBe( 'Sunrise Timelapse Over Lake Titicaca (4K)' );
		expect( draft.durationSeconds ).toBe( 187 );
		expect( draft.thumbnailUrl ).toBe( 'https://i.ytimg.com/vi/Zt8vWy2RbQ4/hqdefault.jpg' );
		expect( draft.guid ).toBe( '' );
		expect( draft.isProcessing ).toBe( false );
	} );

	it( 'types a placeholder as draft by mime even without the import field', async () => {
		// With the Studio flag off the server strips jetpack_videopress_import,
		// but stale placeholders still list; typed 'local' they would offer an
		// "Upload to VideoPress" action that can't work on a fileless post.
		const body = JSON.stringify( [
			{
				id: 52,
				title: { rendered: 'Stale placeholder' },
				mime_type: 'video/videopress-draft',
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
		expect( result.current.items[ 0 ].type ).toBe( 'draft' );
		expect( result.current.items[ 0 ].title ).toBe( 'Stale placeholder' );
	} );
} );
