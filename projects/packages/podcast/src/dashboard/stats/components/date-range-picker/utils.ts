/**
 * Preset computation + active-preset detection for the date-range
 * picker. Mirrors the activity-log port of Calypso's
 * `client/dashboard/components/date-range-picker/utils.ts`, with
 * `last-90-days` and `all-time` added so the existing podcast period
 * presets stay one-click reachable.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	startOfDay,
	isSameDay,
	addDays,
	addYears,
	startOfMonth,
	startOfYear,
	differenceInCalendarDays,
} from 'date-fns';
import { formatDate, parseYmdLocal, formatYmd } from './datetime';

const ALL_TIME_DAYS = 365;

const lastNDays = ( date: Date, n: number ) => ( {
	from: new Date( date.getFullYear(), date.getMonth(), date.getDate() - ( n - 1 ) ),
	to: date,
} );
const monthToDate = ( date: Date ) => ( {
	from: new Date( date.getFullYear(), date.getMonth(), 1 ),
	to: date,
} );
const yearToDate = ( date: Date ) => ( {
	from: new Date( date.getFullYear(), 0, 1 ),
	to: date,
} );
const lastTwelveMonths = ( date: Date ) => ( {
	from: new Date( date.getFullYear() - 1, date.getMonth(), date.getDate() + 1 ),
	to: date,
} );
const lastThreeYears = ( date: Date ) => ( {
	from: new Date( date.getFullYear() - 3, date.getMonth(), date.getDate() + 1 ),
	to: date,
} );

export type PresetId =
	| 'today'
	| 'yesterday'
	| 'last-7-days'
	| 'last-30-days'
	| 'last-90-days'
	| 'month-to-date'
	| 'last-12-months'
	| 'year-to-date'
	| 'last-3-years'
	| 'all-time'
	| 'custom';

export const presetDefs = [
	{ id: 'today', label: __( 'Today', 'jetpack-podcast' ) },
	{ id: 'yesterday', label: __( 'Yesterday', 'jetpack-podcast' ) },
	{ id: 'last-7-days', label: __( 'Last 7 days', 'jetpack-podcast' ) },
	{ id: 'last-30-days', label: __( 'Last 30 days', 'jetpack-podcast' ) },
	{ id: 'last-90-days', label: __( 'Last 90 days', 'jetpack-podcast' ) },
	{ id: 'month-to-date', label: __( 'Month to date', 'jetpack-podcast' ) },
	{ id: 'last-12-months', label: __( 'Last 12 months', 'jetpack-podcast' ) },
	{ id: 'year-to-date', label: __( 'Year to date', 'jetpack-podcast' ) },
	{ id: 'last-3-years', label: __( 'Last 3 years', 'jetpack-podcast' ) },
	{ id: 'all-time', label: __( 'All time', 'jetpack-podcast' ) },
] as const satisfies ReadonlyArray< { id: Exclude< PresetId, 'custom' >; label: string } >;

/**
 * Inclusive date range for a preset.
 *
 * @param preset   - Preset id.
 * @param baseDate - Reference "today" date.
 * @return         From/to range, or undefined for `custom`.
 */
export function computePresetRange( preset: PresetId, baseDate: Date ) {
	switch ( preset ) {
		case 'today':
			return { from: baseDate, to: baseDate };
		case 'yesterday':
			return {
				from: new Date( baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1 ),
				to: new Date( baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1 ),
			};
		case 'last-7-days':
			return lastNDays( baseDate, 7 );
		case 'last-30-days':
			return lastNDays( baseDate, 30 );
		case 'last-90-days':
			return lastNDays( baseDate, 90 );
		case 'month-to-date':
			return monthToDate( baseDate );
		case 'last-12-months':
			return lastTwelveMonths( baseDate );
		case 'year-to-date':
			return yearToDate( baseDate );
		case 'last-3-years':
			return lastThreeYears( baseDate );
		case 'all-time':
			return lastNDays( baseDate, ALL_TIME_DAYS );
		default:
			return undefined;
	}
}

/**
 * Match a date range against the preset list.
 *
 * @param from     - Range start.
 * @param to       - Range end.
 * @param baseDate - Reference "today" date.
 * @return         Matching preset id, or undefined.
 */
export function getActivePresetId( from?: Date, to?: Date, baseDate?: Date ): PresetId | undefined {
	if ( ! from || ! to || ! baseDate ) {
		return;
	}
	let newFrom = startOfDay( from );
	let newTo = startOfDay( to );
	if ( newFrom.getTime() > newTo.getTime() ) {
		const tmp = newFrom;
		newFrom = newTo;
		newTo = tmp;
	}

	const todayStart = startOfDay( baseDate );
	const yesterdayStart = addDays( todayStart, -1 );

	if ( isSameDay( newFrom, todayStart ) && isSameDay( newTo, todayStart ) ) {
		return 'today';
	}
	if ( isSameDay( newFrom, yesterdayStart ) && isSameDay( newTo, yesterdayStart ) ) {
		return 'yesterday';
	}

	if ( isSameDay( newTo, todayStart ) ) {
		const diff = differenceInCalendarDays( todayStart, newFrom );
		if ( diff === 6 ) {
			return 'last-7-days';
		}
		if ( diff === 29 ) {
			return 'last-30-days';
		}
		if ( diff === 89 ) {
			return 'last-90-days';
		}
		if ( diff === ALL_TIME_DAYS - 1 ) {
			return 'all-time';
		}
		if (
			isSameDay( newFrom, addYears( todayStart, -1 ) ) ||
			isSameDay( newFrom, addDays( addYears( todayStart, -1 ), 1 ) )
		) {
			return 'last-12-months';
		}
		if (
			isSameDay( newFrom, addYears( todayStart, -3 ) ) ||
			isSameDay( newFrom, addDays( addYears( todayStart, -3 ), 1 ) )
		) {
			return 'last-3-years';
		}
	}

	if ( isSameDay( newFrom, startOfMonth( todayStart ) ) && isSameDay( newTo, todayStart ) ) {
		return 'month-to-date';
	}
	if ( isSameDay( newFrom, startOfYear( todayStart ) ) && isSameDay( newTo, todayStart ) ) {
		return 'year-to-date';
	}

	for ( const preset of presetDefs ) {
		const range = computePresetRange( preset.id as PresetId, todayStart );
		if (
			range &&
			isSameDay( newFrom, startOfDay( range.from ) ) &&
			isSameDay( newTo, startOfDay( range.to ) )
		) {
			return preset.id as PresetId;
		}
	}
	return undefined;
}

/**
 * Trigger button label, e.g. "May 6, 2026 to May 12, 2026".
 *
 * @param start  - Range start.
 * @param end    - Range end.
 * @param locale - BCP 47 locale tag.
 * @return       Label.
 */
export function formatLabel( start: Date, end: Date, locale: string ): string {
	return sprintf(
		/* translators: %1$s: start date, %2$s: end date */
		__( '%1$s to %2$s', 'jetpack-podcast' ),
		formatDate( start, locale, { dateStyle: 'medium' } ),
		formatDate( end, locale, { dateStyle: 'medium' } )
	);
}

/**
 * Detect whether a range corresponds to the "Last 7 days" preset.
 *
 * @param range          - Range.
 * @param range.start    - Range start.
 * @param range.end      - Range end.
 * @param timezoneString - IANA timezone identifier.
 * @param gmtOffset      - Offset in hours.
 * @return               Match.
 */
export function isLast7Days(
	range: { start: Date; end: Date },
	timezoneString?: string,
	gmtOffset?: number
): boolean {
	const siteToday =
		parseYmdLocal( formatYmd( new Date(), timezoneString, gmtOffset ) ) ??
		new Date( new Date().getFullYear(), new Date().getMonth(), new Date().getDate() );
	return getActivePresetId( range.start, range.end, siteToday ) === 'last-7-days';
}
