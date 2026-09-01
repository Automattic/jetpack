import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import createNumberFormatters from '../create-number-formatters.ts';

const mockGetSettings = jest.fn( () => ( {
	l10n: {
		locale: 'fr-FR',
	},
} ) );

const originalWp = window.wp;

describe( 'createNumberFormatters() - locale resolution/fallback', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.wp = {
			date: {
				getSettings: mockGetSettings,
			},
		};
	} );

	afterEach( () => {
		window.wp = originalWp;
	} );

	it( 'should use locale from WordPress user settings when available', () => {
		const numberFormatters = createNumberFormatters();
		const result = numberFormatters.formatNumber( 1234567 );

		// French locale uses narrow no-break spaces (U+202F) as thousand separators
		expect( result ).toBe( '1\u202f234\u202f567' );
	} );

	it( 'should fall back to browser locale when WordPress locale is not set', () => {
		mockGetSettings.mockReturnValue( { l10n: { locale: '' } } );

		// In jsdom v26, the property for 'language' exists on the prototype of `global.window.navigator`.
		const nav = Object.getPrototypeOf( global.window.navigator );
		const originalLanguageDescriptor = Object.getOwnPropertyDescriptor( nav, 'language' );
		try {
			Object.defineProperty( nav, 'language', {
				...originalLanguageDescriptor,
				get: () => 'de-DE',
			} );
			expect( global.window.navigator.language ).toBe( 'de-DE' ); // Check that it worked.

			const numberFormatters = createNumberFormatters();
			const result = numberFormatters.formatNumber( 1234567 );

			expect( result ).toBe( '1.234.567' );
		} finally {
			Object.defineProperty( nav, 'language', originalLanguageDescriptor! );
		}
	} );

	it( 'should fall back to `FALLBACK_LOCALE` ("en") when no locale is available', () => {
		mockGetSettings.mockReturnValue( { l10n: { locale: '' } } );

		const originalNavigator = global.window.navigator;
		try {
			// Remove window.navigator to test fallback to 'en'
			// @ts-expect-error - intentionally deleting navigator to test fallback
			delete global.window.navigator;
			expect( global.window.navigator ).toBeUndefined(); // Check that it worked.

			const numberFormatters = createNumberFormatters();
			const result = numberFormatters.formatNumber( 1234567 );

			expect( result ).toBe( '1,234,567' );
		} finally {
			global.window.navigator = originalNavigator;
		}
	} );
} );
