// Shape of the AI tab's initial state, bootstrapped onto
// `window.JetpackScriptData.seo.ai` (see `Initializer::get_ai_data()`).
// Each toggle writes through the existing `/jetpack/v4/settings` endpoint:
// the Enhancer via `ai_seo_enhancer_enabled`, llms.txt via
// `jetpack_seo_llms_txt_enabled`, and crawler blocks via
// `jetpack_seo_blocked_ai_crawlers`.

/** A known AI crawler offered as a per-bot toggle in the AI tab. */
export interface AiCrawler {
	/** Stable key persisted in the blocked list and sent on save. */
	slug: string;
	/** Human-facing crawler name (e.g. "ChatGPT (OpenAI)"). */
	label: string;
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
		/** The known AI crawlers, each rendered as an allow/block toggle. */
		catalog: AiCrawler[];
		/** Slugs currently blocked from the site. */
		blocked: string[];
	};
}
