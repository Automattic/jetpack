/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatLegendLabels } from '../format-legend-labels';
import type { ReportParams } from '@jetpack-premium-analytics/data';

// Captured before any test installs settings over them, so the fixtures vary
// only the timezone and inherit what `@wordpress/date` actually ships.
const DEFAULTS = getSettings();

/**
 * Install date settings for a site in a given timezone.
 *
 * @param timeZone - IANA zone name.
 * @param offset   - Offset in hours, as WordPress reports it.
 * @param locale   - Unique moment locale name for the fixture, since
 *                 `setSettings` skips redefining a locale it already knows.
 */
const siteIn = ( timeZone: string, offset: number, locale: string ) =>
	setSettings( {
		...DEFAULTS,
		l10n: { ...DEFAULTS.l10n, locale },
		timezone: { offset, offsetFormatted: String( offset ), string: timeZone, abbr: '' },
	} );

// The en dash between thin spaces CLDR puts between the ends of a range.
const SEP = '\u2009\u2013\u2009';

describe( 'formatLegendLabels', () => {
	// A date-only param has no offset of its own. Read as UTC it lands on the
	// previous day for every site west of Greenwich.
	it( 'keeps date-only params on their own calendar day for a site west of UTC', () => {
		siteIn( 'America/New_York', -5, 'en-nyc-test' );

		const labels = formatLegendLabels( {
			from: '2026-01-01',
			to: '2026-01-31',
			compare_from: '2025-12-01',
			compare_to: '2025-12-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( `January 1${ SEP }31, 2026` );
		expect( labels.comparison ).toBe( `December 1${ SEP }31, 2025` );
	} );

	it( 'keeps date-only params on their own calendar day for a site east of UTC', () => {
		siteIn( 'Asia/Taipei', 8, 'en-tpe-test' );

		const labels = formatLegendLabels( {
			from: '2026-01-01',
			to: '2026-01-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( `January 1${ SEP }31, 2026` );
	} );

	it( 'honours the offset a full ISO param already carries', () => {
		siteIn( 'Europe/Amsterdam', 2, 'en-ams-test' );

		const labels = formatLegendLabels( {
			from: '2026-06-29T00:00:00.000+02:00',
			to: '2026-07-28T23:59:59.999+02:00',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( `June 29${ SEP }July 28, 2026` );
	} );

	it( 'falls back to the generic comparison label without comparison params', () => {
		siteIn( 'UTC', 0, 'en-utc-test' );

		const labels = formatLegendLabels( {
			from: '2026-01-01',
			to: '2026-01-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.comparison ).toBe( 'Previous period' );
	} );

	it( 'falls back to readable labels when date params are invalid', () => {
		siteIn( 'UTC', 0, 'en-invalid-date-test' );

		const labels = formatLegendLabels( {
			from: 'garbage',
			to: '2026-01-31',
			compare_from: 'junk',
			compare_to: '2025-12-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( 'Current period' );
		expect( labels.comparison ).toBe( 'Previous period' );
	} );
} );
