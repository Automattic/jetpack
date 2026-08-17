// Shape of the aggregated Overview state the server bootstraps onto
// `window.JetpackScriptData.seo.overview` (see `Dashboard_Data::get_overview_data()`).
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
	// Whether the controls that switch a Jetpack module on or off can do anything
	// on this site. False on WordPress.com Simple, which ships no Jetpack modules
	// and reports every one of them active.
	modules_switchable: boolean;
}
