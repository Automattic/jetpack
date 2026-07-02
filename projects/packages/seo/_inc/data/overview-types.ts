// Shape of the aggregated Overview state the server bootstraps onto
// `window.JetpackScriptData.seo.overview` (see `Initializer::get_overview_data()`).
// Plain TypeScript — the server owns the payload, so no runtime schema is needed.

export interface SiteVisibility {
	search_engines_visible: boolean;
	sitemap_active: boolean;
	seo_tools_active: boolean;
}

export interface SiteVerification {
	google: boolean;
	bing: boolean;
	pinterest: boolean;
	yandex: boolean;
	facebook: boolean;
}

export interface ContentCoverage {
	total: number;
	with_schema: number;
	with_title: number;
	with_description: number;
	with_search_visible: number;
}

export interface OverviewResponse {
	site_visibility: SiteVisibility;
	site_verification: SiteVerification;
	content_coverage: ContentCoverage;
	plan: {
		seo_enabled_for_site: boolean;
	};
	// True on WordPress.com Simple, where SEO tools are always active and can't be
	// disabled — used to hide the Overview's "Disable SEO tools" off-ramp there.
	is_simple: boolean;
}
