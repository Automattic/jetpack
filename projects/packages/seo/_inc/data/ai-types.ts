// Shape of the AI tab's initial state, bootstrapped onto
// `window.JetpackScriptData.seo.ai` (see `Dashboard_Data::get_ai_data()`).
// Each toggle writes through the existing `/jetpack/v4/settings` endpoint:
// the Enhancer via `ai_seo_enhancer_enabled` and llms.txt via
// `jetpack_seo_llms_txt_enabled`.

/** One entry in the AI crawler catalog (see `Ai_Crawlers::get_catalog()`). */
export interface AiCrawler {
	/** Stable catalog key, persisted in the override map. */
	slug: string;
	/** Human-readable name shown in the UI. */
	label: string;
	/** User-agent token written to the robots.txt `User-agent:` line. */
	userAgent: string;
	/** Training crawlers are blocked by default; answer-engine crawlers are allowed. */
	type: 'answer' | 'training';
}

export interface AiState {
	enhancer: {
		/** Whether the plan + feature filter make the SEO Enhancer available. */
		available: boolean;
		/** Whether the SEO Enhancer is currently enabled. */
		enabled: boolean;
	};
	llmsTxt: {
		/** Whether llms.txt generation is switched on. */
		enabled: boolean;
		/** The site's llms.txt URL, for the "view" link. */
		url: string;
		/**
		 * Whether WordPress can actually serve the dynamic /llms.txt here. False
		 * when a static llms.txt or the host's setup fronts the request, so the
		 * toggle would silently do nothing — the tab then shows an honest notice.
		 */
		canServe: boolean;
	};
	crawlers: {
		/** The full AI crawler catalog. */
		catalog: AiCrawler[];
		/**
		 * Sparse per-crawler overrides (`slug => blocked`). Only deviations from
		 * each bot's default policy are present; absent slugs use the default
		 * (training → blocked, answer → allowed).
		 */
		overrides: Record< string, boolean >;
		/** Whether search engines (and AI crawlers) may index the site. */
		searchEnginesVisible: boolean;
		/** Whether the site is on a crawl-restricted `*.wpcomstaging.com` subdomain. */
		restrictedSubdomain: boolean;
		/** Whether a static robots.txt file exists in the WordPress installation directory. */
		staticRobotsTxt: boolean;
		/** Whether WordPress.com's site-wide data-sharing opt-out overrides per-bot settings. */
		dataSharingOptOut: boolean;
		/** Whether the network shares one origin-level robots.txt across path-based sites. */
		pathBasedMultisite: boolean;
		/** URL of the "Prevent third-party sharing" setting, linked when it governs crawler access. */
		privacySettingsUrl: string;
		/** The site's `/robots.txt` URL, linked under each crawler group so the output can be verified. */
		robotsTxtUrl: string;
	};
}
