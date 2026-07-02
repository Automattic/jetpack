// Shape of the AI tab's initial state, bootstrapped onto
// `window.JetpackScriptData.seo.ai` (see `Initializer::get_ai_data()`).
// Each toggle writes through the existing `/jetpack/v4/settings` endpoint:
// the Enhancer via `ai_seo_enhancer_enabled` and llms.txt via
// `jetpack_seo_llms_txt_enabled`.

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
}
