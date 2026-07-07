/**
 * Playlist artwork resolution, shared by the dashboard (playlists screens)
 * and the block editor (playlist block preview). Pure — no data-layer
 * imports, so the editor bundle can use it without pulling react-query.
 */

/** The slice of a /wp/v2/media item that artwork resolution reads. */
export type ArtworkMedia = {
	id: number;
	/** 'image' for images; video attachments arrive as 'file'. */
	media_type?: string;
	mime_type?: string;
	source_url?: string;
	media_details?: {
		sizes?: Record< string, { source_url?: string } >;
		videopress?: { poster?: string };
	};
};

/**
 * The `_fields` value that fetches exactly what artwork resolution reads —
 * media_details carries the image sizes and the VideoPress poster.
 */
export const ARTWORK_MEDIA_FIELDS = 'id,media_type,mime_type,source_url,media_details';

/**
 * Resolve a fetched media attachment to a displayable artwork URL.
 *
 * `vps_playlist_artwork_id` may reference either an uploaded IMAGE or a
 * VIDEO chosen from the playlist, so both are handled: images resolve to
 * their medium size (falling back to the original), videos to their
 * VideoPress poster. Anything else — including a deleted attachment
 * (null/undefined input) — resolves to null, which renders the placeholder.
 *
 * @param media - The fetched media item, or null/undefined when missing.
 * @return The artwork image URL, or null when none can be derived.
 */
export function artworkUrlFromMedia( media: ArtworkMedia | null | undefined ): string | null {
	if ( ! media ) {
		return null;
	}
	if ( media.media_type === 'image' || media.mime_type?.startsWith( 'image/' ) ) {
		return media.media_details?.sizes?.medium?.source_url ?? media.source_url ?? null;
	}
	return media.media_details?.videopress?.poster ?? null;
}
