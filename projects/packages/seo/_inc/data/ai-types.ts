// Shape of the AI tab's initial state, bootstrapped onto
// `window.JetpackScriptData.seo.ai` (see `Initializer::get_ai_data()`).
// The AI SEO Enhancer toggle writes through the existing `/jetpack/v4/settings`
// endpoint (`ai_seo_enhancer_enabled`).

export interface AiState {
	enhancer: {
		/** Whether the plan + feature filter make the SEO Enhancer available. */
		available: boolean;
		/** Whether the SEO Enhancer is currently enabled. */
		enabled: boolean;
	};
}
