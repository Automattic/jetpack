import {
	canonicalizeLanguageTag,
	formatLanguageTagForDisplay,
	getLanguageDisplayName,
	getManualLanguageTagFromTrackKey,
	getSiteLanguageTag,
	isGeneratedLanguageKey,
} from '../language';

describe( 'video track language utilities', () => {
	describe( 'canonicalizeLanguageTag', () => {
		it( 'canonicalizes BCP-47 language tags', () => {
			expect( canonicalizeLanguageTag( 'EN-us' ) ).toBe( 'en-US' );
			expect( canonicalizeLanguageTag( 'pt-br' ) ).toBe( 'pt-BR' );
			expect( canonicalizeLanguageTag( 'zh-hant-tw' ) ).toBe( 'zh-Hant-TW' );
			expect( canonicalizeLanguageTag( 'es-419' ) ).toBe( 'es-419' );
		} );

		it( 'accepts tags longer than five characters', () => {
			expect( canonicalizeLanguageTag( 'sl-rozaj-biske-1994' ) ).toBe( 'sl-1994-biske-rozaj' );
		} );

		it( 'rejects invalid language tags', () => {
			expect( canonicalizeLanguageTag( '' ) ).toBeNull();
			expect( canonicalizeLanguageTag( 'en_US' ) ).toBeNull();
			expect( canonicalizeLanguageTag( 'not a language' ) ).toBeNull();
		} );

		it( 'rejects generated language keys', () => {
			expect( canonicalizeLanguageTag( 'auto_en' ) ).toBeNull();
			expect( canonicalizeLanguageTag( 'auto-en' ) ).toBeNull();
		} );
	} );

	describe( 'isGeneratedLanguageKey', () => {
		it( 'detects generated and legacy keys', () => {
			expect( isGeneratedLanguageKey( 'auto_en' ) ).toBe( true );
			expect( isGeneratedLanguageKey( 'AUTO-en' ) ).toBe( true );
			expect( isGeneratedLanguageKey( 'en-US' ) ).toBe( false );
		} );
	} );

	describe( 'formatLanguageTagForDisplay', () => {
		it( 'preserves generated keys for display', () => {
			expect( formatLanguageTagForDisplay( 'auto_en' ) ).toBe( 'auto_en' );
		} );

		it( 'canonicalizes valid existing tags for display', () => {
			expect( formatLanguageTagForDisplay( 'EN-us' ) ).toBe( 'en-US' );
		} );
	} );

	describe( 'getLanguageDisplayName', () => {
		it( 'localizes plain language tags', () => {
			expect( getLanguageDisplayName( 'en' ) ).toBe( 'English' );
			expect( getLanguageDisplayName( 'fr' ) ).toBe( 'French' );
			expect( getLanguageDisplayName( 'zh-Hans' ) ).toBe( 'Simplified Chinese' );
		} );

		it( 'renders regional variants as Language (REGION) rather than dialect names', () => {
			expect( getLanguageDisplayName( 'en-US' ) ).toBe( 'English (US)' );
			expect( getLanguageDisplayName( 'pt-BR' ) ).toBe( 'Portuguese (BR)' );
		} );

		it( 'labels the GB region as UK', () => {
			expect( getLanguageDisplayName( 'en-GB' ) ).toBe( 'English (UK)' );
		} );

		it( 'expands numeric UN M49 regions to their localized name', () => {
			expect( getLanguageDisplayName( 'es-419' ) ).toBe( 'Spanish (Latin America)' );
		} );

		it( 'returns unresolvable values unchanged', () => {
			expect( getLanguageDisplayName( 'not a language' ) ).toBe( 'not a language' );
		} );
	} );

	describe( 'getSiteLanguageTag', () => {
		afterEach( () => {
			document.documentElement.lang = '';
		} );

		it( 'canonicalizes the document language', () => {
			document.documentElement.lang = 'en-us';
			expect( getSiteLanguageTag() ).toBe( 'en-US' );
		} );

		it( 'falls back to English when the document language is empty or invalid', () => {
			document.documentElement.lang = '';
			expect( getSiteLanguageTag() ).toBe( 'en' );

			document.documentElement.lang = 'not a language';
			expect( getSiteLanguageTag() ).toBe( 'en' );
		} );
	} );

	describe( 'getManualLanguageTagFromTrackKey', () => {
		it( 'extracts editable language tags from generated keys', () => {
			expect( getManualLanguageTagFromTrackKey( 'auto_en' ) ).toBe( 'en' );
			expect( getManualLanguageTagFromTrackKey( 'auto_pt_br' ) ).toBe( 'pt-BR' );
		} );

		it( 'canonicalizes regular language tags', () => {
			expect( getManualLanguageTagFromTrackKey( 'EN-us' ) ).toBe( 'en-US' );
		} );

		it( 'returns an empty string for generated keys with no resolvable language', () => {
			expect( getManualLanguageTagFromTrackKey( 'auto_transcribed' ) ).toBe( '' );
		} );
	} );
} );
