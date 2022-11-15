export type videoDataProps = {
	title?: string;
	description?: string;
};

export type useVideoDataProps = {
	videoData: videoDataProps;
	isRequestingVideoData: boolean;
};
