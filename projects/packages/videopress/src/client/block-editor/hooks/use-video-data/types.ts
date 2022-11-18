export type videoDataProps = {
	title?: string;
	description?: string;
};

export type UseVideoDataProps = {
	videoData: videoDataProps;
	isRequestingVideoData: boolean;
};
