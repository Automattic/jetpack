/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatDate } from './format-date';
import { siteTimeZone } from './site-time-zone';

/** The parts a locale's default `date_format` renders. */
const RANGE_PARTS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
};

/**
 * Two dates over a year apart, so no locale can elide anything from a range
 * between them. Noon UTC keeps them on the same calendar day in every zone.
 */
const PROBE_FROM = new Date( Date.UTC( 2020, 0, 2, 12 ) );
const PROBE_TO = new Date( Date.UTC( 2021, 1, 3, 12 ) );

/**
 * The site's locale as a tag `Intl` accepts.
 *
 * WordPress sends its own locale name (`es_ES`, `de_DE_formal`), which is close
 * to BCP 47 but not always a valid tag. Subtags are dropped from the right
 * until one parses, so `es_ES` becomes `es-ES` and a test fixture's
 * `en-us-test` still resolves to `en-US`.
 *
 * @return The tag, or `undefined` when nothing parses.
 */
function intlLocale(): string | undefined {
	const parts = getSettings().l10n.locale.replace( /_/g, '-' ).split( '-' );

	while ( parts.length ) {
		try {
			return Intl.getCanonicalLocales( parts.join( '-' ) )[ 0 ];
		} catch {
			parts.pop();
		}
	}

	return undefined;
}

/**
 * Build a range formatter for the current settings, if one can be trusted.
 *
 * WordPress publishes whole date formats and no rules for eliding a month or
 * year shared by both ends of a range — but CLDR, which `Intl` is built on, has
 * them for every locale. They can only be borrowed where WordPress and `Intl`
 * agree on what a single date looks like, which holds while the site is on its
 * locale's default `date_format`. Two checks establish that, so no allowlist of
 * trusted locales has to be kept in step with CLDR:
 *
 * 1. `Intl` renders a single date exactly as `formatDate` does. A site with a
 *    custom `date_format` fails here and keeps the format it asked for.
 * 2. `Intl` builds a range that cannot be elided out of that same rendering.
 *    `ja` and `zh` fail here: their single dates read `2025年6月21日`, but
 *    their ranges switch to `2025/06/21～2025/06/25`.
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

	const single = formatter.format( PROBE_FROM );
	const rendersLikeSite = single === formatDate( PROBE_FROM );
	const rangeKeepsRendering = formatter.formatRange( PROBE_FROM, PROBE_TO ).includes( single );

	return rendersLikeSite && rangeKeepsRendering ? formatter : undefined;
}

let cache: { key: string; formatter: Intl.DateTimeFormat | undefined } | undefined;

/**
 * Format a range with the shared month or year elided, where the site's own
 * date format allows it.
 *
 * The probes in `buildRangeFormatter` cost two formats, so the result is held
 * against the settings it was derived from; those only change when the page
 * reloads, or when a test installs new ones.
 *
 * @param from - Start of the range.
 * @param to   - End of the range.
 * @return The elided range, or `undefined` to fall back to spelling both ends out.
 */
export function elideRange( from: Date, to: Date ): string | undefined {
	const settings = getSettings();
	const key = `${ settings.l10n.locale }|${ settings.formats.date }|${ siteTimeZone() }`;

	if ( cache?.key !== key ) {
		cache = { key, formatter: buildRangeFormatter() };
	}

	return cache.formatter?.formatRange( from, to );
}
