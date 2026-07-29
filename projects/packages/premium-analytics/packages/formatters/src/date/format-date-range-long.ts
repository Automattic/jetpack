/**
 * Internal dependencies
 */
import { formatDate } from './format-date';
import { getDateRangeSpan } from './get-date-range-span';

/**
 * A date range with optional start and end.
 *
 * Defined locally to avoid a cross-package import on
 * `@jetpack-premium-analytics/datetime` (which exports an identical
 * `DateRange` type). Switch to that import once the sibling-package
 * `link:` wiring is settled.
 */
type DateRange = { from?: Date; to?: Date };

type FormatDateRangeLongOptions = {
	/**
	 * Year treated as current, against which the year is considered redundant.
	 * Defaults to the year of the current date.
	 */
	referenceYear?: number;
};

/**
 * En dash, the range separator the design specifies. Spaced, since the
 * endpoints are multi-word.
 */
const RANGE_SEPARATOR = ' – ';

/**
 * Format a date range in the explicit, readable form the section header
 * subtitle uses.
 *
 * The shape follows the range's own length. Day-scale ranges lead with the
 * weekday, which is what makes a rolling window legible at a glance; longer
 * ranges drop it as noise and always carry the year, since they routinely span
 * two. The year is added to day-scale ranges only when they fall outside the
 * reference year, so stepping back through past periods stays unambiguous
 * without repeating the current year on every render.
 *
 * @example
 * formatDateRangeLong( { from, to } ) // 7 days:      'Tuesday, July 21 – Monday, July 27'
 *                                     // past year:   'Tuesday, July 16 – Monday, July 22, 2024'
 *                                     // 12 months:   'July 1, 2025 – June 30, 2026'
 *
 * @param range     - The range to format.
 * @param [options] - Formatting options.
 * @return The formatted range, or `''` when `range`, `from`, or `to` is missing.
 */
export const formatDateRangeLong = (
	range?: DateRange,
	options: FormatDateRangeLongOptions = {}
): string => {
	const from = range?.from;
	const to = range?.to;

	if ( ! from || ! to ) {
		return '';
	}

	const span = getDateRangeSpan( { from, to } );

	if ( span?.unit === 'month' || span?.unit === 'year' ) {
		return `${ formatDate( from, 'long' ) }${ RANGE_SEPARATOR }${ formatDate( to, 'long' ) }`;
	}

	const referenceYear = options.referenceYear ?? new Date().getFullYear();
	const inReferenceYear =
		from.getFullYear() === referenceYear && to.getFullYear() === referenceYear;
	const pattern = inReferenceYear ? 'EEEE, MMMM d' : 'EEEE, MMMM d, yyyy';

	return `${ formatDate( from, pattern ) }${ RANGE_SEPARATOR }${ formatDate( to, pattern ) }`;
};
