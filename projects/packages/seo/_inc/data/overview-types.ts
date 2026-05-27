export interface OverviewResponse {
	site_visibility: {
		search_engines_visible: boolean;
		sitemap_active: boolean;
		sitemap_url: string;
		seo_tools_active: boolean;
		front_page_description: string;
	};
	plan: {
		seo_enabled_for_site: boolean;
	};
}
