import { languageToLocale } from '../locale';

describe( 'languageToLocale', () => {
	test( 'empty string should return en', () => {
		expect( languageToLocale( '' ) ).toBe( 'en' );
	} );

	test( 'underscores should be replaced', () => {
		expect( languageToLocale( 'pt_BR' ) ).toBe( 'pt-br' );
		expect( languageToLocale( 'zh_CN' ) ).toBe( 'zh-cn' );
		expect( languageToLocale( 'zh_TW' ) ).toBe( 'zh-tw' );
	} );

	test( 'country codes should be dropped', () => {
		expect( languageToLocale( 'en-GB' ) ).toBe( 'en' );
		expect( languageToLocale( 'en_US' ) ).toBe( 'en' );
		expect( languageToLocale( 'es-ES' ) ).toBe( 'es' );
	} );

	test( 'locales should be lowercase', () => {
		expect( languageToLocale( 'EN' ) ).toBe( 'en' );
		expect( languageToLocale( 'FR' ) ).toBe( 'fr' );
		expect( languageToLocale( 'PL' ) ).toBe( 'pl' );
	} );
} );
