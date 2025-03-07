import { setLocale } from 'i18n-calypso';

export function initializeI18n() {
	if (
		typeof window === 'object' &&
		typeof window.Jetpack_Editor_Initial_State === 'object' &&
		typeof window.Jetpack_Editor_Initial_State.siteLocale === 'string'
	) {
		setLocale( {
			'': {
				// The locale string from PHP is in the format 'en-US', but we need just 'en'
				// for the localeSlug
				localeSlug: window.Jetpack_Editor_Initial_State.siteLocale.split( '-' )[ 0 ],
				// The actual locale variant can include the region
				localeVariant: window.Jetpack_Editor_Initial_State.siteLocale,
				// Default to English plural forms if we don't have a more specific one
				'Plural-Forms': 'nplurals=2; plural=n != 1',
			},
		} );
	}
}
