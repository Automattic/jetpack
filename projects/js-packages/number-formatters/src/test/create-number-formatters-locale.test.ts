import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockDateSettings = {
	l10n: {
		locale: 'fr-FR',
		months: [],
		monthsShort: [],
		weekdays: [],
		weekdaysShort: [],
		meridiem: { am: '', pm: '', AM: '', PM: '' },
		relative: { future: '', past: '' },
		startOfWeek: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
	},
	formats: {
		time: '',
		date: '',
		datetime: '',
		datetimeAbbreviated: '',
	},
	timezone: {
		offset: '',
		string: '',
		abbr: '',
		offsetFormatted: '',
	},
};

// Mock @wordpress/date before any imports that use it
const mockGetSettings = jest.fn( () => mockDateSettings );
await jest.unstable_mockModule( '@wordpress/date', () => ( {
	getSettings: mockGetSettings,
} ) );

// Now dynamically import all dependencies after mocks are set up
const { default: createNumberFormatters } = await import( '../create-number-formatters.ts' );

describe( 'createNumberFormatters() - locale resolution/fallback', () => {
	const numberFormatters = createNumberFormatters();
	const originalNavigator = global.window?.navigator;

	beforeEach( () => {
		jest.clearAllMocks();
		mockGetSettings.mockReturnValue( mockDateSettings );
	} );

	afterEach( () => {
		// Restore original window.navigator
		Object.defineProperty( global, 'window', {
			value: originalNavigator,
			writable: true,
		} );
	} );

	it( 'should use locale from WordPress user settings when available', () => {
		// Verify that fr-FR locale is being used
		mockGetSettings.mockReturnValue( mockDateSettings );
		const result = numberFormatters.formatNumber( 1234567 );

		expect( result ).toBe( '1 234 567' );
	} );

	it( 'should fall back to browser locale when WordPress locale is not set', () => {
		// Mock getSettings to return undefined locale
		mockGetSettings.mockReturnValue( {
			...mockDateSettings,
			l10n: { ...mockDateSettings.l10n, locale: '' },
		} );

		// Mock window.navigator.language to return de-DE
		Object.defineProperty( global, 'window', {
			value: {
				navigator: {
					language: 'de-DE',
				},
			},
			writable: true,
		} );

		const result = numberFormatters.formatNumber( 1234567 );

		expect( result ).toBe( '1.234.567' );
	} );

	it( 'should fall back to `FALLBACK_LOCALE` ("en") when no locale is available', () => {
		// Mock getSettings to return undefined locale
		mockGetSettings.mockReturnValue( {
			...mockDateSettings,
			l10n: { ...mockDateSettings.l10n, locale: '' },
		} );

		// Remove window.navigator to test fallback to 'en'
		Object.defineProperty( global, 'window', {
			value: undefined,
			writable: true,
		} );

		const result = numberFormatters.formatNumber( 1234567 );

		expect( result ).toBe( '1,234,567' );
	} );
} );
