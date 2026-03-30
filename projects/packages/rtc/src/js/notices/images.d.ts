declare module '*.png' {
	const src: string;
	export default src;
}

interface JetpackRtcNoticesConfig {
	assetsUrl?: string;
	isAdmin: boolean;
	isPlanOwner: boolean;
	postId: number;
	postType?: string;
	userId?: number;
	postTitle: string;
	postEditUrl: string;
	postsListUrl: string;
	siteSlug: string;
	maxPeersPerRoom?: number;
	enableLimitNotices?: boolean;
	/** URL to initiate the Jetpack/WP.com user connection flow. Empty string when the user is already connected. */
	connectUserUrl: string;
}

interface Window {
	jetpackRtcNotices?: JetpackRtcNoticesConfig;
}
