import { AI_PATH, OVERVIEW_PATH, SETTINGS_PATH } from '../../get-preloaded';
import { makeSchemaSettings } from './schema-settings-fixtures';
import type { AiState } from '../../ai-types';
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
	title_formats: {},
	verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
	search_engines_visible: true,
	sitemap_active: false,
	sitemap_url: '',
	canonical_active: false,
	schema: SEEDED_SCHEMA,
};

export const SEEDED_AI: AiState = {
	enhancer: { available: true, enabled: false },
};

( window as unknown as { JetpackScriptData: unknown } ).JetpackScriptData = {
	seo: {
		preload: {
			[ OVERVIEW_PATH ]: { body: { content_coverage: SEEDED_COVERAGE } },
			[ SETTINGS_PATH ]: { body: SEEDED_SETTINGS },
			[ AI_PATH ]: { body: SEEDED_AI },
		},
	},
};
