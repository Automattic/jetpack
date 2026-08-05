/**
 * `@wordpress/date` settings fixtures.
 *
 * The formatter reads the site's `date_format` and WordPress's translated
 * month names, so tests drive it by installing real settings rather than by
 * mocking the formatter.
 */

/**
 * External dependencies
 */
import { getSettings, type DateSettings } from '@wordpress/date';

/**
 * The package's own defaults, captured before any test installs settings over
 * them. Fixtures vary only the fields under test and inherit the rest, so they
 * cannot drift from what `@wordpress/date` actually ships.
 */
const DEFAULTS = getSettings();

/**
 * `DateSettings['l10n']['months']` is moment's wider `LocaleSpecification`
 * shape, which also admits a standalone/format object and a callback. The
 * package ships a plain array, so narrow it once here rather than at each use.
 */
const DEFAULT_MONTHS = DEFAULTS.l10n.months as string[];

const ES_MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

/**
 * Build a settings object for a locale.
 *
 * The timezone is fixed to UTC so assertions do not depend on the machine
 * running the suite. Tests that vary the zone spread the result and replace
 * the `timezone` block.
 *
 * @param locale     - Moment locale name. Must be unique per fixture, since
 *                   `setSettings` skips redefining a locale it already knows.
 * @param dateFormat - The site's `date_format` option, in PHP tokens.
 * @param months     - Translated month names, January first. Defaults to the
 *                   package's English names.
 * @return Settings ready for `setSettings`.
 */
export const settingsFor = (
	locale: string,
	dateFormat: string,
	months: string[] = DEFAULT_MONTHS
): DateSettings => ( {
	...DEFAULTS,
	l10n: {
		...DEFAULTS.l10n,
		locale,
		months,
		monthsShort: months.map( month => month.slice( 0, 3 ) ),
	},
	formats: { ...DEFAULTS.formats, date: dateFormat },
	timezone: { offset: 0, offsetFormatted: '0', string: 'UTC', abbr: 'UTC' },
} );

/** A site left on the US English default. */
export const EN_US_SETTINGS = settingsFor( 'en_US_test', 'F j, Y' );

/**
 * A Spanish site. Its `date_format` puts the day first and spells "de" with
 * escaped literals (`\d\e`), which double as the day and timezone tokens.
 */
export const ES_ES_SETTINGS = settingsFor( 'es_ES_test', 'j \\d\\e F \\d\\e Y', ES_MONTHS );

/**
 * Build a UTC date, matching the fixtures' timezone so no day shift is in play.
 *
 * @param year  - Full year.
 * @param month - 1-based month.
 * @param day   - Day of month.
 * @return The date.
 */
export const utcDate = ( year: number, month: number, day: number ): Date =>
	new Date( Date.UTC( year, month - 1, day ) );
