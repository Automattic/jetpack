export interface OverviewResponse {
	site_visibility: {
		search_engines_visible: boolean;
		sitemap_active: boolean;
		sitemap_url: string;
		seo_tools_active: boolean;
		front_page_description: string;
	};
	content_seo: {
		total_published: number;
		sample_size: number;
		missing_title: number;
		missing_desc: number;
		noindexed: number;
	};
	ai_discoverability: {
		llms_txt_enabled: boolean;
		crawlers: Record< string, 'allow' | 'block' >;
	};
	site_verification: {
		google: string;
		bing: string;
		pinterest: string;
		yandex: string;
		facebook: string;
	};
	plan: {
		seo_enabled_for_site: boolean;
	};
}
