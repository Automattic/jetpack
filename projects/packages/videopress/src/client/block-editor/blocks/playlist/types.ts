import type { VideoGUID } from '../video/types';

/**
 * A stored playlist entry. Only the video reference and numeric metadata
 * (used for server-rendered totals) are persisted; display metadata —
 * title and poster — is always read live from the video data, by the
 * editor and by the front-end view script alike.
 */
export type PlaylistEntry = {
	guid: VideoGUID;
	durationMs?: number;
	height?: number;
};

/**
 * Live display metadata for one video, fetched from the videos API and
 * never persisted in block attributes.
 */
export type PlaylistLiveMetadata = {
	title?: string;
	poster?: string;
	// The video is private and its thumbnail could not be authorized for this
	// viewer; the entry shows the lock placeholder instead.
	isPrivateLocked?: boolean;
};

export type PlaylistLayout = 'side-rail' | 'grid' | 'strip';

/**
 * The display and playback options shared by every playlist-style block;
 * each block adds its own source of entries on top.
 */
export type PlaylistDisplayAttributes = {
	layout: PlaylistLayout;
	darkPlayer: boolean;
	showPlayer: boolean;
	autoplayNext: boolean;
	muteByDefault: boolean;
	loopPlaylist: boolean;
	showThumbnail: boolean;
	showTitle: boolean;
	showResolution: boolean;
	showDuration: boolean;
	showPositionNumber: boolean;
	showTotalRuntime: boolean;

	/*
	 * Theme font-family preset slug (theme.json) for the entry titles; an
	 * empty string inherits the surrounding font.
	 */
	entryTitleFontFamily: string;
};

export type PlaylistAttributes = PlaylistDisplayAttributes & {
	/*
	 * Key of this playlist in the site's playlist index; assigned once the
	 * block is inserted, and unique among the playlist blocks of a post.
	 */
	playlistId: string;
	playlistTitle: string;
	playlistDescription: string;
	videos: PlaylistEntry[];
};
