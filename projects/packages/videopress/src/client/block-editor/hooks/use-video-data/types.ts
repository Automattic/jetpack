export type WPV2MediaAPIResponseProps = {
	jetpack_videopress?: {
		title: string;
		description: string;
	};
};

export type VideoData = {
	title?: string;
	description?: string;
};

export type useVideoDataProps = {
	videoData: VideoData;
	isRequestingVideoData: boolean;
};
