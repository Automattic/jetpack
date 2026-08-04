// Shape of the editable Settings state the server bootstraps onto
// `window.JetpackScriptData.seo.settings` (see `Dashboard_Data::get_settings_data()`).
// Most writes go through `/jetpack/v4/settings`; nested Schema writes use the
// package-owned schema-settings route.

import type { SchemaSettings } from './schema-settings-types';

export interface TitleFormatToken {
	type: 'string' | 'token';
	value: string;
}

export interface SettingsResponse {
	front_page_description: string;
	// True when the site kept a front-page description from the era it was free for
	// all WordPress.com Simple sites. Such sites keep editing that one field even
	// when otherwise plan-gated (the value stays live). Read-only, never sent back.
	has_legacy_front_page_meta: boolean;
	title_formats: Record< string, TitleFormatToken[] >;
	// Separator WordPress joins document-title parts with (`document_title_separator`,
	// default `-`). Used to preview the default title of a page type that has no
	// stored format. Read-only, never sent back.
	title_separator: string;
	// Server-owned conflict state. False keeps saved formats visible but read-only
	// and prevents them from being included in a save payload.
	title_formats_editable: boolean;
	verification_tools_active: boolean;
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
