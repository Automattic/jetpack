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
	canonical_urls_enabled: boolean;
}

export type VerificationKey = keyof SettingsResponse[ 'verification' ];

export interface SettingsUpdatePayload {
	front_page_description?: string;
	title_formats?: Record< string, TitleFormatToken[] >;
	verification?: Partial< SettingsResponse[ 'verification' ] >;
	canonical_urls_enabled?: boolean;
}
