export type WPV2MediaAPIResponseProps = {
	jetpack_videopress?: {
		title: string;
		description: string;
	};
};

export type VideoItem = {
	title: string;
	description: string;
};

export type UseVideoItemProps = [ VideoItem, boolean ];
