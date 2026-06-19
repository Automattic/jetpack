// Shape of the editable Settings state the server bootstraps onto
// `window.JetpackScriptData.seo.settings` (see `Initializer::get_settings_data()`).
// Writes go through the existing `/jetpack/v4/settings` REST endpoint.

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
	canonical_active: boolean;
}

export type VerificationKey = keyof SettingsResponse[ 'verification' ];
