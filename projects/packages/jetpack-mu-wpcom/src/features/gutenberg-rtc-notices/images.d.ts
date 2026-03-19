declare module '*.png' {
	const src: string;
	export default src;
}

interface WpcomRtcNoticesConfig {
	isAdmin: boolean;
	welcomeDismissed: boolean;
	postId: number;
	postTitle: string;
	postEditUrl: string;
	postsListUrl: string;
	siteSlug: string;
	maxPeersPerRoom?: number;
	maxClientsPerUser?: number;
}

interface Window {
	wpcomRtcNotices?: WpcomRtcNoticesConfig;
}
