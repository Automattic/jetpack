import type { ChartFormatting } from '../types';

/**
 * `process.env.NODE_ENV` is replaced by the bundler at build time. Declare a
 * minimal `process` locally so this file type-checks as source under `jetpack:src`.
 */
declare const process: { env: Record< string, string | undefined > };

// One `Intl.DateTimeFormat` per locale, zone and options triple. The axis formats
// every bucket in the domain, and rebuilding the formatter is what costs; the tick
// formats themselves are rebuilt on every resize, so a per-closure cache is not
// enough. Bounded by the host's own locale and zone, so a handful of entries.
const formatters = new Map< string, Intl.DateTimeFormat >();

const getFormatter = (
	options: Intl.DateTimeFormatOptions,
	{ locale, timeZone }: ChartFormatting
): Intl.DateTimeFormat => {
	const key = `${ locale ?? '' }|${ timeZone ?? '' }|${ JSON.stringify( options ) }`;
	let formatter = formatters.get( key );

	if ( ! formatter ) {
		formatter = new Intl.DateTimeFormat( locale, { ...options, timeZone } );
		formatters.set( key, formatter );
	}

	return formatter;
};

const warned = new Set< string >();

const warnOnce = ( key: string, message: string ): void => {
	if ( warned.has( key ) || process.env.NODE_ENV === 'production' ) {
		return;
	}

	warned.add( key );
	// eslint-disable-next-line no-console
	console.warn( `[Charts] ${ message }` );
};

const isUsable = ( formatting: ChartFormatting ): boolean => {
	try {
		// Constructing is the check: `Intl` throws on a tag or zone it cannot use.
		Intl.DateTimeFormat( formatting.locale, { timeZone: formatting.timeZone } );
		return true;
	} catch {
		return false;
	}
};

/**
 * Drops a locale or time zone `Intl` cannot use, falling back to the runtime's own.
 *
 * Every formatter below is built during render, so an unusable string would throw
 * where React unmounts the whole host tree rather than one chart. WordPress hands
 * out both of the likeliest ones: `get_locale()` returns `en_US`, not `en-US`, and
 * `timezone_string` is `''` on a site set to a raw UTC offset.
 *
 * @param formatting - Locale and time zone as the host supplied them.
 * @return The usable halves, each `undefined` where the host's value was not.
 */
export const sanitizeFormatting = ( formatting: ChartFormatting ): ChartFormatting => {
	if ( isUsable( formatting ) ) {
		return formatting;
	}

	const locale = isUsable( { locale: formatting.locale } ) ? formatting.locale : undefined;
	const timeZone = isUsable( { timeZone: formatting.timeZone } ) ? formatting.timeZone : undefined;

	if ( locale === undefined && formatting.locale !== undefined ) {
		warnOnce(
			`locale:${ formatting.locale }`,
			`locale ${ JSON.stringify(
				formatting.locale
			) } is not a BCP-47 tag Intl accepts, so dates render in the browser's locale. WordPress locales need their underscore replaced: en_US is en-US.`
		);
	}

	if ( timeZone === undefined && formatting.timeZone !== undefined ) {
		warnOnce(
			`timeZone:${ formatting.timeZone }`,
			`timeZone ${ JSON.stringify(
				formatting.timeZone
			) } is not a zone Intl accepts, so dates render in the browser's zone. Pass an IANA name or a UTC offset such as "+05:30".`
		);
	}

	return { locale, timeZone };
};

/**
 * A date formatter bound to the host's locale and time zone.
 *
 * @param options    - Date-part options, as for `Intl.DateTimeFormat`.
 * @param formatting - Host locale and time zone; either half absent leaves the runtime's own.
 * @return Formatter taking a timestamp or a `Date`.
 */
export const createDateFormatter = (
	options: Intl.DateTimeFormatOptions,
	formatting: ChartFormatting
) => {
	return ( value: number | Date ): string => {
		// `Intl.DateTimeFormat` throws on an invalid date where the `Date` methods
		// it replaces return "Invalid Date", and charts are expected to render past
		// a bad point rather than fail. visx hands its tick formatter a `Date`, so
		// coerce before the check.
		if ( ! Number.isFinite( Number( value ) ) ) {
			return new Date( Number( value ) ).toLocaleDateString();
		}
		return getFormatter( options, formatting ).format( value );
	};
};

// Enough of the calendar to place a tick on a boundary, read in the host's zone
// rather than the browser's. `en-US` only fixes the digits as Latin — nothing
// here is shown to anyone.
const CLOCK_OPTIONS: Intl.DateTimeFormatOptions = {
	month: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	hourCycle: 'h23',
};

export type ZonedFields = {
	/** 1-12. */
	month: number;
	/** 0-23. */
	hour: number;
	minute: number;
};

// What the `Date` getters answer for an invalid date, so a bad point leaves every
// boundary untriggered rather than throwing out of `formatToParts`.
const NO_FIELDS: ZonedFields = { month: NaN, hour: NaN, minute: NaN };

/**
 * A clock reading calendar fields in the host's time zone.
 *
 * `Date`'s own getters read the browser's zone, so a chart viewed from another
 * country anchors its ticks to the wrong midnights and the wrong January
 * without this.
 *
 * @param timeZone - IANA zone name; absent leaves the runtime's own.
 * @return Reader taking a `Date`.
 */
export const createZonedClock = ( timeZone?: string ) => {
	// The `Date` getters already answer in the runtime zone, and cost nothing.
	if ( ! timeZone ) {
		return ( date: Date ): ZonedFields => ( {
			month: date.getMonth() + 1,
			hour: date.getHours(),
			minute: date.getMinutes(),
		} );
	}

	return ( date: Date ): ZonedFields => {
		if ( ! Number.isFinite( Number( date ) ) ) {
			return NO_FIELDS;
		}

		const parts = getFormatter( CLOCK_OPTIONS, { locale: 'en-US', timeZone } ).formatToParts(
			date
		);
		const read = ( type: Intl.DateTimeFormatPartTypes ) =>
			Number( parts.find( part => part.type === type )?.value );

		return { month: read( 'month' ), hour: read( 'hour' ), minute: read( 'minute' ) };
	};
};
