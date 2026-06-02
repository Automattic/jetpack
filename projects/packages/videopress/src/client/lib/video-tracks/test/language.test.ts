import {
	canonicalizeLanguageTag,
	formatLanguageTagForDisplay,
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

		it( 'rejects invalid manual language tags', () => {
			expect( canonicalizeLanguageTag( '' ) ).toBeNull();
			expect( canonicalizeLanguageTag( 'en_US' ) ).toBeNull();
			expect( canonicalizeLanguageTag( 'not a language' ) ).toBeNull();
		} );

		it( 'rejects generated language keys for manual input', () => {
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
} );
