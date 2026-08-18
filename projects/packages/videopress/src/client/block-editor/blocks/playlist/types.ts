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
};

export type PlaylistLayout = 'side-rail' | 'grid' | 'strip';

export type PlaylistAttributes = {
	videos: PlaylistEntry[];
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
