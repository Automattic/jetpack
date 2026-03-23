declare module '*.png' {
	const src: string;
	export default src;
}

interface WpcomRtcNoticesConfig {
	isAdmin: boolean;
	isPlanOwner: boolean;
	welcomeDismissed: boolean;
	postId: number;
	postTitle: string;
	postEditUrl: string;
	postsListUrl: string;
	siteSlug: string;
	maxPeersPerRoom?: number;
	maxClientsPerUser?: number;
	enableLimitNotices?: boolean;
	enableWelcomeNotice?: boolean;
}

interface Window {
	wpcomRtcNotices?: WpcomRtcNoticesConfig;
}
