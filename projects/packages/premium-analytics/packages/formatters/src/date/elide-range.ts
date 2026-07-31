/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatDate } from './format-date';
import { siteTimeZone } from './site-time-zone';

/** The date parts requested from `Intl` when comparing it with WordPress. */
const RANGE_PARTS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
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
 * Two dates with no requested date part in common. The site timezone is
 * applied by both formatters, so a probe crossing a UTC day boundary is safe.
 */
const PROBE_FROM = SINGLE_PROBES[ 0 ];
const PROBE_TO = new Date( Date.UTC( 2021, 1, 3, 12 ) );

/** Treat typographically different Unicode spaces as equivalent. */
const normalizeSpaces = ( value: string ): string =>
	value.replace( /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ' );

/**
 * The site's locale as a tag `Intl` accepts.
 *
 * WordPress sends its own locale name (`es_ES`, `de_DE_formal`), which first
 * needs underscores converted to BCP 47 separators. Some WordPress variants
 * remain invalid after that conversion, so subtags are dropped from the right
 * until a supported ancestor is found; for example, `pt_PT_ao90` resolves to
 * `pt-PT`.
 *
 * A structurally valid but unsupported tag is not usable: `Intl` would resolve
 * it to the visitor's locale, making range output depend on who views the site.
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
 * WordPress publishes whole date formats and no rules for eliding a month or
 * year shared by both ends of a range — but CLDR, which `Intl` is built on, has
 * them for every locale. They can only be borrowed where WordPress and `Intl`
 * agree on how dates look. Two checks establish that, so no allowlist of
 * trusted locales has to be kept in step with CLDR:
 *
 * 1. `Intl` renders representative dates exactly as `formatDate` does. A site
 *    with a custom `date_format` or different month translations fails here
 *    and keeps the format it asked for.
 * 2. `Intl` builds a range that cannot be elided out of that same rendering.
 *    Japanese and Chinese fail here: their range patterns use numeric dates
 *    and locale-specific separators instead of their single-date rendering.
 *
 * @return The formatter, or `undefined` when the two do not agree.
 */
function buildRangeFormatter(): Intl.DateTimeFormat | undefined {
	const locale = intlLocale();

	if ( ! locale ) {
		return undefined;
	}

	let formatter: Intl.DateTimeFormat;

	try {
		formatter = new Intl.DateTimeFormat( locale, {
			...RANGE_PARTS,
			timeZone: siteTimeZone(),
		} );
	} catch {
		// An unusable locale, or an offset identifier this runtime will not take
		// as a `timeZone`.
		return undefined;
	}

	// `formatRange` was added to ECMA-402 later than `Intl.DateTimeFormat`
	// itself. Refusing the formatter here is what keeps a runtime that has the
	// class but not the method on the spelled-out path, since every later call
	// goes through a formatter this function returned.
	if ( typeof formatter.formatRange !== 'function' ) {
		return undefined;
	}

	const rendersLikeSite = SINGLE_PROBES.every(
		probe => formatter.format( probe ) === formatDate( probe )
	);
	const single = formatter.format( PROBE_FROM );
	const rangeKeepsRendering = normalizeSpaces(
		formatter.formatRange( PROBE_FROM, PROBE_TO )
	).startsWith( normalizeSpaces( single ) );

	return rendersLikeSite && rangeKeepsRendering ? formatter : undefined;
}

let cache: { key: string; formatter: Intl.DateTimeFormat | undefined } | undefined;

/**
 * Format a range with the shared month or year elided, where the site's own
 * date format allows it.
 *
 * The probes in `buildRangeFormatter` run once per settings combination, so
 * the result is held against the locale, date format, and timezone it was
 * derived from.
 *
 * @param from - Start of the range.
 * @param to   - End of the range.
 * @return The elided range, or `undefined` to fall back to spelling both ends out.
 */
export function elideRange( from: Date, to: Date ): string | undefined {
	if ( Number.isNaN( from.getTime() ) || Number.isNaN( to.getTime() ) ) {
		return undefined;
	}

	const settings = getSettings();
	const key = `${ settings.l10n.locale }|${ settings.formats.date }|${ siteTimeZone() }`;

	if ( cache?.key !== key ) {
		cache = { key, formatter: buildRangeFormatter() };
	}

	return cache.formatter?.formatRange( from, to );
}
