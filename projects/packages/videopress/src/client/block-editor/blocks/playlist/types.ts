import type { VideoGUID } from '../video/types';

export type PlaylistVideo = {
	guid: VideoGUID;
	title?: string;
	durationMs?: number;
	height?: number;
	poster?: string;
};

export type PlaylistLayout = 'rail' | 'grid' | 'strip';

export type PlaylistBlockAttributes = {
	videos: PlaylistVideo[];
	autoAdvance: boolean;
	loop: boolean;
	layout: PlaylistLayout;
	darkSurface: boolean;
	showThumbnail: boolean;
	showTitle: boolean;
	showResolution: boolean;
	showDuration: boolean;
	showPosition: boolean;
	showTotalRuntime: boolean;
};
