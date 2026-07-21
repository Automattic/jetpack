/**
 * External dependencies
 */
import { addDays, endOfMonth, format, isValid, parse } from 'date-fns';

export type DateIntervalPeriod = 'hour' | 'day' | 'week' | 'month' | 'year' | string;

export type DateIntervalDateParts = {
	startDate: string;
	endDate: string;
};

const DATE_PART_FORMAT = 'yyyy-MM-dd';

/**
 * Extract the calendar date part from a date-like string.
 *
 * @param value - Date-like string, commonly `YYYY-MM-DD` or an ISO datetime.
 * @return Date part when present.
 */
export function getDatePart( value: unknown ): string | undefined {
	return typeof value === 'string' ? value.split( 'T' )[ 0 ] : undefined;
}

/**
 * Format a date part and time into the Premium Analytics ISO-ish response shape.
 *
 * @param datePart - Date part, normally `YYYY-MM-DD`.
 * @param time     - Time part, normally `HH:mm:ss`.
 * @param offset   - Timezone offset suffix.
 * @return Date-time string with offset.
 */
export function formatDatePartWithTime(
	datePart: string,
	time: string,
	offset = '+00:00'
): string {
	return `${ datePart }T${ time }${ offset }`;
}

/**
 * Normalize period-specific interval labels to an interval start date part.
 *
 * @param date   - Reporting interval label or date part.
 * @param period - Reporting period.
 * @return Interval start date part.
 */
function getIntervalStartDatePart( date: string, period?: DateIntervalPeriod ): string {
	const datePart = getDatePart( date ) ?? date;

	if ( period === 'year' && /^\d{4}$/.test( datePart ) ) {
		return `${ datePart }-01-01`;
	}

	if ( period === 'month' && /^\d{4}-\d{2}$/.test( datePart ) ) {
		return `${ datePart }-01`;
	}

	return datePart;
}

/**
 * Parse a calendar date part.
 *
 * @param datePart - Date part in `YYYY-MM-DD` format.
 * @return Parsed date, or null when invalid.
 */
function parseDatePart( datePart: string ): Date | null {
	const date = parse( datePart, DATE_PART_FORMAT, new Date( 0 ) );

	return isValid( date ) ? date : null;
}

/**
 * Return inclusive start/end calendar date parts for a reporting interval.
 *
 * @param date   - Reporting interval label or date part.
 * @param period - Reporting period.
 * @return Inclusive interval start and end date parts.
 */
export function getDateIntervalDateParts(
	date: string,
	period?: DateIntervalPeriod
): DateIntervalDateParts {
	const startDate = getIntervalStartDatePart( date, period );
	const parsedStartDate = parseDatePart( startDate );

	if ( ! parsedStartDate ) {
		return {
			startDate,
			endDate: startDate,
		};
	}

	switch ( period ) {
		case 'week':
			return {
				startDate,
				endDate: format( addDays( parsedStartDate, 6 ), DATE_PART_FORMAT ),
			};

		case 'month':
			return {
				startDate,
				endDate: format( endOfMonth( parsedStartDate ), DATE_PART_FORMAT ),
			};

		case 'year':
			return {
				startDate,
				endDate: `${ parsedStartDate.getFullYear() }-12-31`,
			};

		case 'hour':
		case 'day':
		default:
			return {
				startDate,
				endDate: startDate,
			};
	}
}
