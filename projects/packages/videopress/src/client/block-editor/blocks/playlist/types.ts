import type { VideoGUID } from '../video/types';

export type PlaylistEntry = {
	guid: VideoGUID;
	title?: string;
	durationMs?: number;
	height?: number;
	poster?: string;
};

export type PlaylistLayout = 'side-rail' | 'grid' | 'strip';

export type PlaylistAttributes = {
	videos: PlaylistEntry[];
	layout: PlaylistLayout;
	darkPlayer: boolean;
	autoplayNext: boolean;
	showThumbnail: boolean;
	showTitle: boolean;
	showResolution: boolean;
	showDuration: boolean;
	showPositionNumber: boolean;
	showTotalRuntime: boolean;
};
