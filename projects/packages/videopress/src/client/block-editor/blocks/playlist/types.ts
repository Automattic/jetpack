import type { VideoGUID } from '../video/types';

export type PlaylistVideo = {
	guid: VideoGUID;
	title?: string;
};

export type PlaylistBlockAttributes = {
	videos: PlaylistVideo[];
	autoAdvance: boolean;
	loop: boolean;
};
