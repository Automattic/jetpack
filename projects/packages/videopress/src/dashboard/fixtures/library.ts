import type { LibraryItemPrivacy, LibraryItemType, MockLibraryItem } from '../types/library';

const TITLES = [
	'3D Animation Studio',
	'Castle in the Sky',
	'Forest Walk',
	'Ocean Glide',
	'Desert Bloom',
	'Mountain Climb',
	'Studio Setup',
	'Coffee Brew',
];
const EXTENSIONS = [ 'mov', 'mp4', 'webm' ] as const;
const PRIVACIES: LibraryItemPrivacy[] = [
	'public',
	'public',
	'public',
	'public',
	'public',
	'public',
	'private',
	'private',
	'private',
	'site-default',
	'site-default',
	'site-default',
];

/* Deterministic SVG data-URI thumbnails (no network needed). */
const COLORS = [ '#3858E9', '#117AC9', '#80A35C', '#A36B0F', '#7A2C8C', '#B33A60' ];
const colorThumbnail = ( hex: string ): string => {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">` +
		`<rect width="16" height="9" fill="${ hex }"/></svg>`;
	return `data:image/svg+xml;utf8,${ encodeURIComponent( svg ) }`;
};

const slugify = ( s: string ): string =>
	s
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /(^-|-$)/g, '' );

/**
 * Deterministic mock library generator. Same `count` always returns the same
 * array (so React doesn't see new identities on re-render).
 *
 * Distribution:
 * - ~80% videopress, ~20% local (every 5th item is local).
 * - Privacy cycled through PRIVACIES.
 * - Durations 8s..600s (cycled).
 * - File sizes 5MB..500MB (cycled).
 * - Upload dates spread across the last 90 days (1.8 days apart).
 *
 * @param count - Number of items to generate.
 * @return Mock library items.
 */
export function generateMockLibrary( count = 50 ): MockLibraryItem[] {
	const now = new Date( '2026-05-06T12:00:00Z' ).getTime();
	const dayMs = 24 * 60 * 60 * 1000;

	return Array.from( { length: count }, ( _, i ): MockLibraryItem => {
		const type: LibraryItemType = i % 5 === 4 ? 'local' : 'videopress';
		const baseTitle = TITLES[ i % TITLES.length ];
		const title = `${ baseTitle } ${ i + 1 }`;
		const ext = EXTENSIONS[ i % EXTENSIONS.length ];
		const filename = `${ slugify( baseTitle ) }-v${ ( i % 9 ) + 1 }-${ String( i + 1 ).padStart(
			2,
			'0'
		) }.${ ext }`;
		const durationSeconds = 8 + ( ( i * 17 ) % 600 );
		const fileSizeBytes = ( 5 + ( ( i * 11 ) % 495 ) ) * 1024 * 1024;
		const uploadDate = new Date( now - i * 1.8 * dayMs ).toISOString();
		const privacy = PRIVACIES[ i % PRIVACIES.length ];

		return {
			id: `mock-${ i + 1 }`,
			type,
			title,
			filename,
			thumbnailUrl: type === 'videopress' ? colorThumbnail( COLORS[ i % COLORS.length ] ) : null,
			durationSeconds,
			uploadDate,
			privacy,
			fileSizeBytes,
			upload: { status: 'idle', progress: 0 },
		};
	} );
}
