/**
 * languageToLocale converts a language tag to an ISO 639 conforming locale string.
 *
 * @param {string} language - a language tag to be converted, e.g. "en_US".
 * @return {string} ISO 639 locale string, e.g. "en".
 */
export function languageToLocale( language ) {
	const withCountryCode = [ 'pt_br', 'pt-br', 'zh_tw', 'zh-tw', 'zh_cn', 'zh-cn' ];

	language = language.toLowerCase();
	if ( withCountryCode.includes( language ) ) {
		language = language.replace( '_', '-' );
	} else {
		language = language.replace( /([-_].*)$/i, '' );
	}

	if ( language === '' ) {
		return 'en';
	}

	return language;
}
