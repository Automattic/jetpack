declare module '*.png' {
	const src: string;
	export default src;
}

interface JetpackRtcNoticesConfig {
	assetsUrl?: string;
	isAdmin: boolean;
	isPlanOwner: boolean;
	welcomeDismissed: boolean;
	postId: number;
	postTitle: string;
	postEditUrl: string;
	postsListUrl: string;
	siteSlug: string;
	maxPeersPerRoom?: number;
	enableWelcomeNotice?: boolean;
	enableLimitNotices?: boolean;
}

interface Window {
	jetpackRtcNotices?: JetpackRtcNoticesConfig;
}
