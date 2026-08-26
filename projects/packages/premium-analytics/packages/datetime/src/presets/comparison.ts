/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { differenceInCalendarDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { getDateRangeSpan } from '../date-range-span';
import {
	COMPARISON_PREVIOUS_MONTH,
	COMPARISON_PREVIOUS_PERIOD,
	COMPARISON_PREVIOUS_WEEK,
	COMPARISON_PREVIOUS_YEAR,
	getComparisonRangeFromPreset,
	getWholeMonthCount,
	type ComparisonPresetId,
	type ComparisonRangeOptions,
	type DateRange,
} from '../get-comparison-range';

/**
 * A comparison the applied range can offer: the preset, the resolved window,
 * and labels naming it.
 */
export type ComparisonOption = {
	id: ComparisonPresetId;
	label: string;
	/**
	 * Abbreviated preset name for the picker's trigger, which shares the date
	 * filter row and cannot grow with the language.
	 */
	shortLabel: string;
	range: Required< DateRange >;
};

/**
 * The longest range, in inclusive days, that still offers each shifted
 * comparison. A shift must never land the comparison overlapping the range
 * itself: 7 covers the week shift, 28 the month shift in February. From a year
 * up, the previous year and the previous period converge (or sit one day apart
 * across a leap year), so the year option adds noise, not signal.
 */
const MAX_DAYS_FOR_WEEK = 7;
const MAX_DAYS_FOR_MONTH = 28;
const MAX_DAYS_FOR_YEAR = 364;

/**
 * Whole-month spans only read in years from two years up, mirroring
 * `getDateRangeSpan`: the design spells a twelve-month window "12 months".
 */
const MIN_WHOLE_MONTHS_FOR_YEARS = 24;
const MONTHS_PER_YEAR = 12;

/**
 * Trigger abbreviations. Translated separately rather than truncated: the
 * English form abbreviates a word.
 */
const SHORT_LABELS: Record< ComparisonPresetId, () => string > = {
	[ COMPARISON_PREVIOUS_PERIOD ]: () =>
		/* translators: abbreviation for "Previous period". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. period', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_WEEK ]: () =>
		/* translators: abbreviation for "Same period from last week". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. week', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_MONTH ]: () =>
		/* translators: abbreviation for "Same period in <month>". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. month', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_YEAR ]: () =>
		/* translators: abbreviation for "Same period in <year>". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. year', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
};

/**
 * Label for the previous-period option, spelling out the length of the window
 * it mirrors. Follows the same whole-months branch as the range math, so the
 * label never contradicts the window it names.
 *
 * @param reference - The applied range the comparison mirrors.
 * @return The label.
 */
function getPreviousPeriodLabel( reference: Required< DateRange > ): string {
	const wholeMonths = getWholeMonthCount( reference.from, reference.to );

	if ( wholeMonths === 1 ) {
		return __( 'Previous month', 'jetpack-premium-analytics-pkg' );
	}

	if (
		wholeMonths &&
		wholeMonths >= MIN_WHOLE_MONTHS_FOR_YEARS &&
		wholeMonths % MONTHS_PER_YEAR === 0
	) {
		const years = wholeMonths / MONTHS_PER_YEAR;
		return sprintf(
			/* translators: %d: number of years covered by the selected date range. */
			_n( 'Previous %d year', 'Previous %d years', years, 'jetpack-premium-analytics-pkg' ),
			years
		);
	}

	if ( wholeMonths ) {
		return sprintf(
			/* translators: %d: number of months covered by the selected date range. */
			_n( 'Previous %d month', 'Previous %d months', wholeMonths, 'jetpack-premium-analytics-pkg' ),
			wholeMonths
		);
	}

	const span = getDateRangeSpan( reference );

	if ( span?.unit === 'hour' ) {
		if ( span.value === 1 ) {
			return __( 'Previous hour', 'jetpack-premium-analytics-pkg' );
		}
		return sprintf(
			/* translators: %d: number of hours covered by the selected date range. */
			_n( 'Previous %d hour', 'Previous %d hours', span.value, 'jetpack-premium-analytics-pkg' ),
			span.value
		);
	}

	const days = differenceInCalendarDays( reference.to, reference.from ) + 1;

	if ( days === 1 ) {
		return __( 'Previous day', 'jetpack-premium-analytics-pkg' );
	}

	return sprintf(
		/* translators: %d: number of days covered by the selected date range. */
		_n( 'Previous %d day', 'Previous %d days', days, 'jetpack-premium-analytics-pkg' ),
		days
	);
}

/**
 * Label for an option, naming the comparison target rather than the offset: a
 * range set in 2025 offers "Same period in 2024".
 *
 * @param id         - The comparison preset.
 * @param reference  - The applied range.
 * @param comparison - The resolved comparison range.
 * @return The label.
 */
function getOptionLabel(
	id: ComparisonPresetId,
	reference: Required< DateRange >,
	comparison: Required< DateRange >
): string {
	if ( id === COMPARISON_PREVIOUS_WEEK ) {
		return __( 'Same period from last week', 'jetpack-premium-analytics-pkg' );
	}

	if ( id === COMPARISON_PREVIOUS_MONTH ) {
		const monthName = getSettings().l10n.months[ comparison.from.getMonth() ];
		return sprintf(
			/* translators: %s: name of the month the comparison period starts in, e.g. "July". */
			_x( 'Same period in %s', 'previous month comparison', 'jetpack-premium-analytics-pkg' ),
			monthName
		);
	}

	if ( id === COMPARISON_PREVIOUS_YEAR ) {
		return sprintf(
			/* translators: %s: the year the comparison period starts in, e.g. "2025". */
			_x( 'Same period in %s', 'previous year comparison', 'jetpack-premium-analytics-pkg' ),
			String( comparison.from.getFullYear() )
		);
	}

	return getPreviousPeriodLabel( reference );
}

/**
 * The comparison options the given range offers, in display order.
 *
 * Derived from the range alone — a custom range, a stepped window, or a preset
 * all resolve through the same rules: the previous period is always offered;
 * the week, month, and year shifts only while they cannot overlap the range;
 * and an option resolving to the same window as an earlier one is dropped, so
 * a 7-day range lists no last-week entry.
 *
 * @param reference - The applied range (both ends required).
 * @param options   - The context the range was produced in; the preset it came
 *                  from decides how a to-date window is measured.
 * @return The options, empty when the range is incomplete or inverted.
 */
export function getComparisonOptions(
	reference: DateRange,
	options: ComparisonRangeOptions = {}
): ComparisonOption[] {
	const refFrom = reference?.from;
	const refTo = reference?.to;

	if ( ! refFrom || ! refTo || refTo < refFrom ) {
		return [];
	}

	const days = differenceInCalendarDays( refTo, refFrom ) + 1;

	const candidates: ComparisonPresetId[] = [ COMPARISON_PREVIOUS_PERIOD ];
	if ( days <= MAX_DAYS_FOR_WEEK ) {
		candidates.push( COMPARISON_PREVIOUS_WEEK );
	}
	if ( days <= MAX_DAYS_FOR_MONTH ) {
		candidates.push( COMPARISON_PREVIOUS_MONTH );
	}
	if ( days <= MAX_DAYS_FOR_YEAR ) {
		candidates.push( COMPARISON_PREVIOUS_YEAR );
	}

	const offered: ComparisonOption[] = [];

	for ( const id of candidates ) {
		const range = getComparisonRangeFromPreset( reference, id, options );

		if ( ! range?.from || ! range.to ) {
			continue;
		}

		const resolved = range as Required< DateRange >;
		const duplicate = offered.some(
			option =>
				option.range.from.getTime() === resolved.from.getTime() &&
				option.range.to.getTime() === resolved.to.getTime()
		);

		if ( duplicate ) {
			continue;
		}

		offered.push( {
			id,
			label: getOptionLabel( id, { from: refFrom, to: refTo }, resolved ),
			shortLabel: SHORT_LABELS[ id ](),
			range: resolved,
		} );
	}

	return offered;
}
