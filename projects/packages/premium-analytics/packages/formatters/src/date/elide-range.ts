/**
 * External dependencies
 */
import { siteTimeZone } from '@jetpack-premium-analytics/datetime';
import { getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatDate } from './format-date';

/**
 * Forms a range can be elided in. All three name the month, so the elision
 * rules CLDR publishes for one apply to the others; they differ in its width
 * and in whether the year is carried at all.
 */
export type RangeFormatName = 'medium' | 'compact' | 'compactNoYear';

/** The date parts requested from `Intl` when comparing it with WordPress. */
const RANGE_PARTS: Record< RangeFormatName, Intl.DateTimeFormatOptions > = {
	medium: { year: 'numeric', month: 'long', day: 'numeric' },
	compact: { year: 'numeric', month: 'short', day: 'numeric' },
	compactNoYear: { month: 'short', day: 'numeric' },
};

/**
 * Dates spread across the calendar catch custom formats and translated month
 * tables that happen to agree with `Intl` for only one date.
 */
const SINGLE_PROBES = [
	...Array.from(
		{ length: 12 },
		( _, month ) => new Date( Date.UTC( 2020, month, month + 1, 12 ) )
	),
	new Date( Date.UTC( 2021, 0, 1, 12 ) ),
];

/**
 * The near end of the probe range. The site timezone is applied by both
 * formatters, so a probe crossing a UTC day boundary is safe.
 */
const PROBE_FROM = SINGLE_PROBES[ 0 ];

/**
 * The far end, per form: a date sharing no requested part with `PROBE_FROM`, so
 * nothing in the probe can be elided.
 *
 * A form carrying the year needs its ends in different years, or the year
 * elides. The year-less form needs them in the same one — ICU puts a year back
 * to disambiguate a two-year range, costing Hungarian and Czech their elision.
 */
const PROBE_TO: Record< RangeFormatName, Date > = {
	medium: new Date( Date.UTC( 2021, 1, 3, 12 ) ),
	compact: new Date( Date.UTC( 2021, 1, 3, 12 ) ),
	compactNoYear: new Date( Date.UTC( 2020, 1, 3, 12 ) ),
};

/** Treat typographically different Unicode spaces as equivalent. */
const normalizeSpaces = ( value: string ): string =>
	value.replace( /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ' );

/**
 * The site's locale as a tag `Intl` accepts.
 *
 * WordPress sends its own locale name (`es_ES`, `pt_PT_ao90`), so subtags are
 * dropped from the right until a supported ancestor is found. A structurally
 * valid but unsupported tag would resolve to the visitor's locale instead.
 *
 * @return The supported tag, or `undefined` when no supported ancestor exists.
 */
export function intlLocale(): string | undefined {
	const parts = getSettings().l10n.locale.replace( /_/g, '-' ).split( '-' );

	while ( parts.length ) {
		try {
			const locale = Intl.getCanonicalLocales( parts.join( '-' ) )[ 0 ];

			if ( Intl.DateTimeFormat.supportedLocalesOf( locale ).length ) {
				return locale;
			}
		} catch {
			// Keep removing variants until the remainder parses.
		}

		parts.pop();
	}

	return undefined;
}

/**
 * Build a range formatter for the current settings, if one can be trusted.
 *
 * WordPress publishes no rules for eliding a month or year shared by both ends
 * of a range; CLDR, which `Intl` is built on, has them. Two probes establish
 * that the two agree — `Intl` renders like `formatDate`, and its range keeps
 * that rendering — so no allowlist of trusted locales has to track CLDR. Run
 * per form, since a locale can agree on one month width and not the other.
 *
 * @param name - The form to build the formatter for.
 * @return The formatter, or `undefined` when the two do not agree.
 */
function buildRangeFormatter( name: RangeFormatName ): Intl.DateTimeFormat | undefined {
	const locale = intlLocale();

	if ( ! locale ) {
		return undefined;
	}

	let formatter: Intl.DateTimeFormat;

	try {
		formatter = new Intl.DateTimeFormat( locale, {
			...RANGE_PARTS[ name ],
			timeZone: siteTimeZone(),
		} );
	} catch {
		// An unusable locale, or an offset identifier this runtime will not take
		// as a `timeZone`.
		return undefined;
	}

	// `formatRange` postdates `Intl.DateTimeFormat`; refusing here keeps a runtime
	// that has the class but not the method on the spelled-out path.
	if ( typeof formatter.formatRange !== 'function' ) {
		return undefined;
	}

	const rendersLikeSite = SINGLE_PROBES.every(
		probe => formatter.format( probe ) === formatDate( probe, name )
	);
	const single = formatter.format( PROBE_FROM );
	const rangeKeepsRendering = normalizeSpaces(
		formatter.formatRange( PROBE_FROM, PROBE_TO[ name ] )
	).startsWith( normalizeSpaces( single ) );

	return rendersLikeSite && rangeKeepsRendering ? formatter : undefined;
}

/** One entry per form, each holding the settings it was derived from. */
const cache = new Map<
	RangeFormatName,
	{ key: string; formatter: Intl.DateTimeFormat | undefined }
>();

/**
 * Format a range with the shared month or year elided, where the site's own
 * date format allows it.
 *
 * The probes in `buildRangeFormatter` run once per settings combination.
 *
 * @param from   - Start of the range.
 * @param to     - End of the range.
 * @param [name] - The form to elide in. Defaults to `'medium'`.
 * @return The elided range, or `undefined` to fall back to spelling both ends out.
 */
export function elideRange(
	from: Date,
	to: Date,
	name: RangeFormatName = 'medium'
): string | undefined {
	if ( Number.isNaN( from.getTime() ) || Number.isNaN( to.getTime() ) ) {
		return undefined;
	}

	const settings = getSettings();
	const key = `${ settings.l10n.locale }|${ settings.formats.date }|${ siteTimeZone() }`;
	const cached = cache.get( name );

	if ( cached?.key !== key ) {
		cache.set( name, { key, formatter: buildRangeFormatter( name ) } );
	}

	return cache.get( name )?.formatter?.formatRange( from, to );
}
