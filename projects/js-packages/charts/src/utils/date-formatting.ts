import type { ChartFormatting } from '../types';

/**
 * A date formatter bound to the host's locale and time zone.
 *
 * Built once per closure and reused: axis code formats every bucket in the
 * domain, and constructing the `Intl.DateTimeFormat` is what costs.
 *
 * @param options    - Date-part options, as for `Intl.DateTimeFormat`.
 * @param formatting - Host locale and time zone; either half absent leaves the runtime's own.
 * @return Formatter taking a timestamp or a `Date`.
 */
export const createDateFormatter = (
	options: Intl.DateTimeFormatOptions,
	formatting: ChartFormatting = {}
) => {
	let formatter: Intl.DateTimeFormat;
	return ( value: number | Date ): string => {
		// `Intl.DateTimeFormat` throws on an invalid date where the `Date` methods
		// it replaces return "Invalid Date", and charts are expected to render past
		// a bad point rather than fail. visx hands its tick formatter a `Date`, so
		// coerce before the check.
		if ( ! Number.isFinite( Number( value ) ) ) {
			return new Date( Number( value ) ).toLocaleDateString();
		}
		formatter =
			formatter ??
			new Intl.DateTimeFormat( formatting.locale, { ...options, timeZone: formatting.timeZone } );
		return formatter.format( value );
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

	let formatter: Intl.DateTimeFormat;
	return ( date: Date ): ZonedFields => {
		formatter = formatter ?? new Intl.DateTimeFormat( 'en-US', { ...CLOCK_OPTIONS, timeZone } );
		const parts = formatter.formatToParts( date );
		const read = ( type: Intl.DateTimeFormatPartTypes ) =>
			Number( parts.find( part => part.type === type )?.value );

		return { month: read( 'month' ), hour: read( 'hour' ), minute: read( 'minute' ) };
	};
};
