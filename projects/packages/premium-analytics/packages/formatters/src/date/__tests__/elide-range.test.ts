/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { settingsFor, utcDate } from '../__fixtures__/wp-date-settings';
import { elideRange, intlLocale } from '../elide-range';

const SR_MONTHS = [
	'јануар',
	'фебруар',
	'март',
	'април',
	'мај',
	'јун',
	'јул',
	'август',
	'септембар',
	'октобар',
	'новембар',
	'децембар',
];

const RU_MONTHS = [
	'января',
	'февраля',
	'марта',
	'апреля',
	'мая',
	'июня',
	'июля',
	'августа',
	'сентября',
	'октября',
	'ноября',
	'декабря',
];

describe( 'intlLocale', () => {
	afterEach( () => jest.restoreAllMocks() );

	it( 'normalizes an underscored WordPress locale', () => {
		setSettings( settingsFor( 'es_ES', 'j \\d\\e F \\d\\e Y' ) );

		expect( intlLocale() ).toBe( 'es-ES' );
	} );

	it( 'keeps a supported WordPress variant', () => {
		setSettings( settingsFor( 'de_DE_formal', 'j. F Y' ) );

		expect( intlLocale() ).toBe( 'de-DE-formal' );
	} );

	it( 'drops an invalid variant until it finds a supported ancestor', () => {
		setSettings( settingsFor( 'pt_PT_ao90', 'j \\d\\e F \\d\\e Y' ) );

		expect( intlLocale() ).toBe( 'pt-PT' );
	} );

	it( 'returns undefined when the locale is exhausted', () => {
		setSettings( settingsFor( 'x', 'F j, Y' ) );

		expect( intlLocale() ).toBeUndefined();
	} );

	it( 'rejects a well-formed locale with no runtime data', () => {
		setSettings( settingsFor( 'bal', 'F j, Y' ) );
		jest.spyOn( Intl.DateTimeFormat, 'supportedLocalesOf' ).mockReturnValue( [] );

		expect( intlLocale() ).toBeUndefined();
	} );
} );

describe( 'elideRange compatibility checks', () => {
	it( 'rejects a range that pads a single date as a substring', () => {
		setSettings( settingsFor( 'sr_RS', 'j. F Y.', SR_MONTHS ) );

		expect( elideRange( utcDate( 2025, 6, 21 ), utcDate( 2025, 6, 25 ) ) ).toBeUndefined();
	} );

	it( 'accepts a range that only changes Unicode spacing', () => {
		setSettings( settingsFor( 'ru_RU', 'j F Y г.', RU_MONTHS ) );

		expect( elideRange( utcDate( 2025, 6, 21 ), utcDate( 2025, 6, 25 ) ) ).toBeDefined();
	} );

	it( 'rejects a runtime whose formatter has no formatRange', () => {
		// `formatRange` is optional here only so the method can be removed and
		// put back; the runtimes this guards against never declared it.
		const prototype = Intl.DateTimeFormat.prototype as { formatRange?: unknown };
		const { formatRange } = prototype;
		delete prototype.formatRange;

		try {
			// Settings no other test uses, so the memoized formatter cannot
			// stand in for the one this test wants built.
			setSettings( settingsFor( 'en_GB', 'j F Y' ) );

			expect( elideRange( utcDate( 2025, 6, 21 ), utcDate( 2025, 6, 25 ) ) ).toBeUndefined();
		} finally {
			prototype.formatRange = formatRange;
		}
	} );
} );
