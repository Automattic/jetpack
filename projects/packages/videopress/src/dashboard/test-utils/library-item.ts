import type { LibraryItem } from '../types/library';

/**
 * Build a LibraryItem test fixture. Defaults model an idle, public
 * VideoPress video; pass overrides for the fields under test.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A complete LibraryItem.
 */
export function makeLibraryItem( overrides: Partial< LibraryItem > = {} ): LibraryItem {
	return {
		id: '42',
		guid: 'abc123',
		type: 'videopress',
		title: 'My Clip',
		filename: 'clip.mp4',
		thumbnailUrl: null,
		durationSeconds: 0,
		uploadDate: '2026-01-01T00:00:00',
		privacy: 'public',
		isPrivate: false,
		fileSizeBytes: 0,
		upload: { status: 'idle', progress: 0 },
		description: '',
		rating: 'G',
		displayEmbed: true,
		allowDownloads: false,
		shortcode: '',
		isProcessing: false,
		tracks: [],
		...overrides,
	};
}
