import { setLocale } from '@automattic/number-formatters';

export function initializeNumberFormatters() {
	if (
		typeof window === 'object' &&
		typeof window.Jetpack_Editor_Initial_State === 'object' &&
		typeof window.Jetpack_Editor_Initial_State.siteLocale === 'string'
	) {
		setLocale( window.Jetpack_Editor_Initial_State.siteLocale );
	}
}
