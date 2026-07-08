// Shape of the editable Settings state the server bootstraps onto
// `window.JetpackScriptData.seo.settings` (see `Initializer::get_settings_data()`).
// Most writes go through `/jetpack/v4/settings`; nested Schema writes use the
// package-owned schema-settings route.

import type { SchemaSettings } from './schema-settings-types';

export interface TitleFormatToken {
	type: 'string' | 'token';
	value: string;
}

export interface SettingsResponse {
	front_page_description: string;
	title_formats: Record< string, TitleFormatToken[] >;
	verification: {
		google: string;
		bing: string;
		pinterest: string;
		yandex: string;
		facebook: string;
	};
	search_engines_visible: boolean;
	sitemap_active: boolean;
	// Read-only: the reachable sitemap URL, or '' until it's been generated and is
	// serveable. Not editable, so it's never sent back in a save payload.
	sitemap_url: string;
	canonical_active: boolean;
	// Read by the Settings bootstrap; saved through `/jetpack/v4/seo/schema-settings`.
	schema: SchemaSettings;
}

export type VerificationKey = keyof SettingsResponse[ 'verification' ];
