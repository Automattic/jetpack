import { GEO_PATH, OVERVIEW_PATH, SETTINGS_PATH } from '../../get-preloaded';
import { makeSchemaSettings } from './schema-settings-fixtures';
import type { GeoState } from '../../geo-types';
import type { ContentCoverage } from '../../overview-types';
import type { SettingsResponse } from '../../settings-types';

/**
 * Seeds `window.JetpackScriptData.seo.preload` before the `@wordpress/data`
 * stores are imported, so their module-level `DEFAULT_STATE` (read from the page
 * preload) is populated. Each store test imports this module *first* — ESM
 * evaluates imports in source order, so the global is set before the store
 * evaluates. Mirrors the `rest_preload_api_request()` shape: each path maps to a
 * `{ body }` envelope.
 */

export const SEEDED_COVERAGE: ContentCoverage = {
	total: 10,
	with_schema: 3,
	with_title: 6,
	with_description: 4,
	with_search_visible: 8,
};

export const SEEDED_SCHEMA = makeSchemaSettings();

export const SEEDED_SETTINGS: SettingsResponse = {
	front_page_description: 'Welcome to the site.',
	has_legacy_front_page_meta: false,
	title_formats: {},
	title_separator: '-',
	title_formats_editable: true,
	conflicting_seo_plugin: '',
	verification_tools_active: true,
	verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
	search_engines_visible: true,
	site_is_private: false,
	site_is_coming_soon: false,
	site_visibility_url: '',
	sitemap_active: false,
	sitemap_switchable: true,
	sitemap_url: '',
	canonical_active: false,
	canonical_switchable: true,
	canonical_conflicted: false,
	schema: SEEDED_SCHEMA,
};

export const SEEDED_GEO: GeoState = {
	enhancer: { available: true, enabled: false, aiSeoEnabled: true, aiEnabled: true },
	llmsTxt: { enabled: false, url: 'https://example.com/llms.txt', canServe: true },
	crawlers: {
		catalog: [
			{
				slug: 'perplexitybot',
				label: 'Perplexity',
				userAgents: [ 'PerplexityBot' ],
				type: 'answer',
			},
			{
				slug: 'gptbot',
				label: 'ChatGPT',
				userAgents: [ 'GPTBot' ],
				type: 'training',
			},
			{
				slug: 'google-extended',
				label: 'Google Gemini',
				userAgents: [ 'Google-Extended' ],
				type: 'training',
			},
		],
		blocked: { answer: [], training: [] },
		searchEnginesVisible: true,
		restrictedSubdomain: false,
		staticRobotsTxt: false,
		dataSharingOptOut: false,
		dataSharingBlocked: [],
		pathBasedMultisite: false,
		privacySettingsUrl: 'http://example.com/wp-admin/options-reading.php',
		robotsTxtUrl: 'http://example.com/robots.txt',
	},
};

( window as unknown as { JetpackScriptData: unknown } ).JetpackScriptData = {
	seo: {
		preload: {
			[ OVERVIEW_PATH ]: { body: { content_coverage: SEEDED_COVERAGE } },
			[ SETTINGS_PATH ]: { body: SEEDED_SETTINGS },
			[ GEO_PATH ]: { body: SEEDED_GEO },
		},
	},
};
