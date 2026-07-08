// UI-side model of a VideoPress playlist. Playlists are `vps_playlist`
// taxonomy terms on attachments (registered by src/class-playlists.php) and
// are consumed exclusively through the core terms REST endpoints at
// /wp/v2/videopress-playlists.

export interface Playlist {
	id: number;
	name: string;
	description: string;
	/** Number of videos assigned to the playlist (term count). */
	count: number;
	/** Attachment ID of the playlist artwork image; null when unset. */
	artworkId: number | null;
	/** Ordered attachment IDs; presentation-only, never decides membership. */
	order: number[];
}

// Raw term shape returned by /wp/v2/videopress-playlists. Term meta rides in
// the `meta` object under the keys registered in class-playlists.php; unset
// single meta comes back as the schema's empty value (0 / '' / []).
export type ApiPlaylistTerm = {
	id: number;
	name?: string;
	description?: string;
	count?: number;
	meta?: {
		vps_playlist_artwork_id?: number;
		vps_playlist_order?: number[];
	};
};

/**
 * Transform a raw /wp/v2/videopress-playlists term into a Playlist.
 *
 * @param raw - The raw term object from the REST API response.
 * @return A normalized Playlist for the VideoPress dashboard UI.
 */
export function toPlaylist( raw: ApiPlaylistTerm ): Playlist {
	const artworkId = raw.meta?.vps_playlist_artwork_id ?? 0;
	return {
		id: raw.id,
		name: raw.name ?? '',
		description: raw.description ?? '',
		count: raw.count ?? 0,
		// 0 is the REST empty value for unset integer meta (and what an
		// artwork reset writes), so it maps to "no artwork".
		artworkId: artworkId > 0 ? artworkId : null,
		order: raw.meta?.vps_playlist_order ?? [],
	};
}
