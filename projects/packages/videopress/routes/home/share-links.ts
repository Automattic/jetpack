import type { LibraryItem } from '../../src/dashboard/types/library';

/**
 * The shareable URL for a video, or null when there isn't an honest one.
 *
 * A VideoPress-hosted video gets its player URL — private videos live on
 * `video.wordpress.com`, public ones on `videopress.com`, the same split
 * `video-details/thumbnail-card.tsx` uses. A local attachment (no GUID — the
 * usual case on a site with no WordPress.com connection) has no player URL, so
 * it falls back to the attachment's own `source_url`, which does resolve and
 * does play.
 *
 * Returns null rather than a guess when there is neither, so the caller can
 * omit the button entirely instead of shipping one that copies nothing.
 *
 * @param item - The library item.
 * @return The URL to copy, or null.
 */
export function resolveShareLink( item: LibraryItem ): string | null {
	if ( item.guid ) {
		const host = item.isPrivate ? 'video.wordpress.com' : 'videopress.com';
		return `https://${ host }/v/${ item.guid }`;
	}

	return item.sourceUrl ? item.sourceUrl : null;
}

/**
 * The embed snippet for a video, or null when there isn't one.
 *
 * `LibraryItem.shortcode` is built from the GUID (see `buildShortcode`), so it
 * is empty for every non-VideoPress attachment. An empty string must not reach
 * a "Copy embed" button — a button that copies nothing is worse than an absent
 * one.
 *
 * @param item - The library item.
 * @return The `[videopress …]` shortcode, or null.
 */
export function resolveEmbedSnippet( item: LibraryItem ): string | null {
	return item.shortcode ? item.shortcode : null;
}
