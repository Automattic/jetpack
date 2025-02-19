declare module '*.svg' {
	const url: string;
}

interface Window {
	_currentSiteId: number;
	_currentSiteType: string;
	wpcomCommentLikesData: {
		likeFeedback: string;
		likedFeedback: string;
		loadingFeedback: string;
	};
}
