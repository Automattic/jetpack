export type PlaylistsAttributes = {
	// 0 shows every playlist.
	limit: number;
	showDescription: boolean;
	// On a playlist archive, leave out the playlist being viewed.
	excludeCurrent: boolean;
	// Thumbnail and name only.
	compact: boolean;
};
