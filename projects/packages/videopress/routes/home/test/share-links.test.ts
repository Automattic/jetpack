/**
 * Unit tests for the Home screen's copy-link / copy-embed resolvers
 * (see routes/home/share-links.ts). Both return null rather than an empty or
 * guessed value so the stage can omit a button instead of shipping an inert one.
 */

import { resolveEmbedSnippet, resolveShareLink } from '../share-links';
import type { LibraryItem } from '../../../src/dashboard/types/library';

const item = ( overrides: Partial< LibraryItem > = {} ): LibraryItem =>
	( {
		id: '7',
		guid: '',
		type: 'local',
		title: 'Clip',
		filename: 'clip.mp4',
		thumbnailUrl: null,
		durationSeconds: 12,
		uploadDate: '2026-08-01T00:00:00',
		privacy: 'site-default',
		isPrivate: false,
		fileSizeBytes: 0,
		upload: { status: 'idle', progress: 0 },
		description: '',
		rating: 'G',
		displayEmbed: false,
		allowDownloads: false,
		shortcode: '',
		isProcessing: false,
		orientation: null,
		tracks: [],
		...overrides,
	} ) as LibraryItem;

describe( 'resolveShareLink', () => {
	it( 'uses the public player host for a VideoPress video', () => {
		expect( resolveShareLink( item( { guid: 'abc123', type: 'videopress' } ) ) ).toBe(
			'https://videopress.com/v/abc123'
		);
	} );

	it( 'uses the private player host for a private VideoPress video', () => {
		expect(
			resolveShareLink( item( { guid: 'abc123', type: 'videopress', isPrivate: true } ) )
		).toBe( 'https://video.wordpress.com/v/abc123' );
	} );

	it( 'falls back to the attachment URL for a local video', () => {
		expect( resolveShareLink( item( { sourceUrl: 'https://example.com/clip.mp4' } ) ) ).toBe(
			'https://example.com/clip.mp4'
		);
	} );

	it( 'returns null when there is nothing to copy', () => {
		expect( resolveShareLink( item() ) ).toBeNull();
	} );
} );

describe( 'resolveEmbedSnippet', () => {
	it( 'returns the shortcode when the video has one', () => {
		expect( resolveEmbedSnippet( item( { shortcode: '[videopress abc123 w=640 h=360]' } ) ) ).toBe(
			'[videopress abc123 w=640 h=360]'
		);
	} );

	it( 'returns null for a video with no shortcode, so no dead button ships', () => {
		expect( resolveEmbedSnippet( item() ) ).toBeNull();
	} );
} );
