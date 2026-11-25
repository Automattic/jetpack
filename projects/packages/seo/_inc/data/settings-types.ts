// Shape of the editable Settings state the server bootstraps onto
// `window.JetpackScriptData.seo.settings` (see `Dashboard_Data::get_settings_data()`).
// Fields backed by an option alone save through core's `/wp/v2/settings`; those
// whose write switches a Jetpack module — sitemap, canonical URLs, site verification
// and SEO tools — and the nested Schema container use package-owned routes.

import type { SchemaSettings } from './schema-settings-types';

export interface TitleFormatToken {
	type: 'string' | 'token';
	value: string;
}

export interface ShareImage {
	id: number;
	src: string;
	alt_text: string;
}

export interface SettingsResponse {
	data_sharing_available?: boolean;
	default_share_image?: ShareImage | null;
	share_image_preview?: string | null;
	front_page_description: string;
	// Read-only: SEO output is disabled, but a legacy front-page description
	// remains available. Never sent back in a save payload.
	has_legacy_front_page_meta: boolean;
	title_formats: Record< string, TitleFormatToken[] >;
	// Separator WordPress joins document-title parts with (`document_title_separator`,
	// default `-`). Used to preview the default title of a page type that has no
	// stored format. Read-only, never sent back.
	title_separator: string;
	// Server-owned: false while Jetpack's SEO output is off, which keeps the saved
	// formats out of a save payload. The card itself locks from `getOutput().paused`.
	title_formats_editable: boolean;
	verification_tools_active: boolean;
	seo_tools_active: boolean;
	verification: {
		google: string;
		bing: string;
		pinterest: string;
		yandex: string;
		facebook: string;
	};
	search_engines_visible: boolean;
	// A private or Coming Soon WordPress.com site. Indexing is off for such a site
	// because it isn't published at all, which no SEO setting here can change — so
	// the toggle is disabled rather than silently inert.
	site_is_private: boolean;
	// Read-only: the unpublished site is Coming Soon rather than private.
	site_is_coming_soon: boolean;
	// Read-only: where the site's visibility is changed.
	site_visibility_url: string;
	sitemap_active: boolean;
	sitemap_switchable: boolean;
	// Read-only: the reachable sitemap URL, or '' until it's been generated and is
	// serveable. Not editable, so it's never sent back in a save payload.
	sitemap_url: string;
	canonical_active: boolean;
	canonical_switchable: boolean;
	// Read-only: another SEO plugin owns canonical output, so the switch is locked.
	canonical_conflicted: boolean;
	// Read by the Settings bootstrap; saved through `/jetpack/v4/seo/schema-settings`.
	schema: SchemaSettings;
}

export type VerificationKey = keyof SettingsResponse[ 'verification' ];
