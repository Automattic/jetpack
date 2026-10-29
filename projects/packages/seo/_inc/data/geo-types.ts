// Shape of the GEO tab's initial state, preloaded from `/jetpack/v4/seo/geo`
// (see `Dashboard_Data::get_geo_data()`).
// Each toggle writes its option through core's `/wp/v2/settings` endpoint:
// the Enhancer via `ai_seo_enhancer_enabled` and llms.txt via
// `jetpack_seo_llms_txt_enabled`.

/** One entry in the AI crawler catalog (see `Ai_Crawlers::get_catalog()`). */
export interface AiCrawler {
	/** Stable catalog key, persisted in the blocked-crawlers option. */
	slug: string;
	/** Human-readable name shown in the UI. */
	label: string;
	/** User-agent token written to the robots.txt `User-agent:` line. */
	userAgent: string;
	/** Which group the crawler is listed under. */
	type: 'answer' | 'training';
}

/**
 * The crawlers the owner blocked, per group: `'all'` (every crawler in the group,
 * including ones added later) or a list of slugs. Every other crawler is allowed.
 */
export type BlockedCrawlers = Record< AiCrawler[ 'type' ], 'all' | string[] >;

export interface GeoState {
	enhancer: {
		/** Whether the plan + feature filter make the SEO Enhancer available. */
		available: boolean;
		/** Whether the SEO Enhancer is currently enabled. */
		enabled: boolean;
		/** Whether the AI SEO control the Enhancer sits under is on. */
		aiSeoEnabled: boolean;
		/** Whether Jetpack AI is on site-wide; when off, AI SEO reads off too. */
		aiEnabled: boolean;
	};
	llmsTxt: {
		/** Whether llms.txt generation is switched on. */
		enabled: boolean;
		/** The site's llms.txt URL, for the "view" link. */
		url: string;
		/** Whether Jetpack can serve llms.txt, considering files, hosting and paused SEO output. */
		canServe: boolean;
	};
	crawlers: {
		/** The full AI crawler catalog. */
		catalog: AiCrawler[];
		/** The crawlers the owner blocked. */
		blocked: BlockedCrawlers;
		/** Whether search engines (and AI crawlers) may index the site. */
		searchEnginesVisible: boolean;
		/** Whether the site is on a crawl-restricted `*.wpcomstaging.com` subdomain. */
		restrictedSubdomain: boolean;
		/** Whether a static robots.txt file exists in the WordPress installation directory. */
		staticRobotsTxt: boolean;
		/** Whether WordPress.com's site-wide data-sharing opt-out overrides per-bot settings. */
		dataSharingOptOut: boolean;
		/** Crawlers WordPress.com's "Prevent third-party sharing" blocks while it's on. */
		dataSharingBlocked: string[];
		/** Whether the network shares one origin-level robots.txt across path-based sites. */
		pathBasedMultisite: boolean;
		/** URL of the "Prevent third-party sharing" setting, linked when it governs crawler access. */
		privacySettingsUrl: string;
		/** The site's `/robots.txt` URL, linked under each crawler group so the output can be verified. */
		robotsTxtUrl: string;
	};
}
