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

// `list` and `queue` link each entry to its post; they need a post source.
export type PlaylistLayout = 'side-rail' | 'grid' | 'strip' | 'list' | 'queue';

/**
 * Where the entries come from. `manual` is the stored `videos` list; the
 * others are resolved on the server from posts (VideoPress Channel feature).
 */
export type PlaylistSource =
	'manual' | 'latest' | 'popular' | 'playlist' | 'current-playlist' | 'featured-playlist';

export type PlaylistAttributes = {
	videos: PlaylistEntry[];
	source: PlaylistSource;
	// Term id of the `playlist` taxonomy, for the `playlist` source.
	playlistId: number;
	// 0 means no limit.
	limit: number;
	// Leave out the post the block renders in.
	excludeCurrent: boolean;
	// Views · date line on `list`/`queue` rows.
	showMeta: boolean;
	layout: PlaylistLayout;
	darkPlayer: boolean;
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
