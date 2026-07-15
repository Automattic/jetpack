// Shape of the AI tab's initial state, bootstrapped onto
// `window.JetpackScriptData.seo.ai` (see `Initializer::get_ai_data()`).
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
	/** `answer` engines are allowed by default; `training` crawlers blocked. */
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
		/** Whether a physical robots.txt at the web root may bypass these directives. */
		staticRobotsTxt: boolean;
	};
}
