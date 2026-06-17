import type { AiState } from '../../ai-types';
import type { ContentCoverage } from '../../overview-types';
import type { SettingsResponse } from '../../settings-types';

/**
 * Seeds `window.JetpackScriptData.seo` before the `@wordpress/data` stores are
 * imported, so their module-level `DEFAULT_STATE` (read from the page bootstrap)
 * is populated. Each store test imports this module *first* — ESM evaluates
 * imports in source order, so the global is set before the store evaluates.
 */

export const SEEDED_COVERAGE: ContentCoverage = {
	total: 10,
	with_description: 4,
	with_schema: 3,
};

export const SEEDED_SETTINGS: SettingsResponse = {
	front_page_description: 'Welcome to the site.',
	title_formats: {},
	verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
	search_engines_visible: true,
	sitemap_active: false,
	canonical_active: false,
};

export const SEEDED_AI: AiState = {
	enhancer: { available: true, enabled: false },
};

( window as unknown as { JetpackScriptData: unknown } ).JetpackScriptData = {
	seo: {
		overview: { content_coverage: SEEDED_COVERAGE },
		settings: SEEDED_SETTINGS,
		ai: SEEDED_AI,
	},
};
