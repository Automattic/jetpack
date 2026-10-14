/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';
import { __, _n, _nx, _x, sprintf } from '@wordpress/i18n';
import { differenceInCalendarDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { getDateRangeSpan } from '../date-range-span';
import {
	COMPARISON_PRESETS,
	COMPARISON_PREVIOUS_MONTH,
	COMPARISON_PREVIOUS_PERIOD,
	COMPARISON_PREVIOUS_PERIOD_MATCH_DAY_OF_WEEK,
	COMPARISON_PREVIOUS_WEEK,
	COMPARISON_PREVIOUS_YEAR,
	COMPARISON_PREVIOUS_YEAR_MATCH_DAY_OF_WEEK,
	WEEKDAY_YEAR_SHIFT_DAYS,
	getComparisonRangeFromPreset,
	getPreviousPeriodMonthCount,
	type ComparisonPresetId,
	type ComparisonRangeOptions,
	type DateRange,
} from '../get-comparison-range';
import type { PrimaryPresetId } from './types';

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
	/**
	 * Abbreviated name a chart legend repeats after each metric, e.g.
	 * "Prev. 30 days", "Sep", "2025".
	 */
	legendLabel: string;
	range: Required< DateRange >;
	/**
	 * Presets resolving to this same window, listed under this option rather
	 * than as entries of their own.
	 */
	aliases: ComparisonPresetId[];
};

/**
 * The longest range, in inclusive days, that still offers each shift without
 * the comparison overlapping the range: 7 for the week, 28 for the month in
 * February and for the weekday-aligned period, 364 for both years (from a
 * year up the previous year and the previous period converge anyway).
 */
const MAX_DAYS_FOR_WEEK = 7;
const MAX_DAYS_FOR_MONTH = 28;
const MAX_DAYS_FOR_YEAR = WEEKDAY_YEAR_SHIFT_DAYS;

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
	[ COMPARISON_PREVIOUS_PERIOD_MATCH_DAY_OF_WEEK ]: () =>
		/* translators: abbreviation for "Previous period (match day of week)". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. period (weekday)', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_WEEK ]: () =>
		/* translators: abbreviation for "Same period from last week". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. week', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_MONTH ]: () =>
		/* translators: abbreviation for "Same period in <month>". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. month', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_YEAR ]: () =>
		/* translators: abbreviation for "Same period in <year>". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. year', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	[ COMPARISON_PREVIOUS_YEAR_MATCH_DAY_OF_WEEK ]: () =>
		/* translators: abbreviation for "Same period last year (match day of week)". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
		_x( 'Prev. year (weekday)', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
};

/**
 * Label for a weekday-aligned option: its calendar sibling's label with a
 * suffix saying the comparison starts on the same weekday.
 *
 * @param siblingLabel - The label of the calendar-aligned option.
 * @return The label.
 */
function getMatchDayOfWeekLabel( siblingLabel: string ): string {
	return sprintf(
		/* translators: %s: a comparison option, e.g. "Previous 30 days". The suffix says the comparison starts on the same weekday. */
		_x( '%s (match day of week)', 'weekday-aligned comparison', 'jetpack-premium-analytics-pkg' ),
		siblingLabel
	);
}

/** The length of a previous window, in the unit its name reads in. */
type PreviousSpan = { unit: 'hour' | 'day' | 'month' | 'year'; count: number };

/**
 * A previous window measured in hours or days, whatever month shape the range
 * has: the weekday-aligned period shifts a whole February by four weeks, not a
 * month, so it must not read "Previous month".
 *
 * @param reference - The applied range the comparison mirrors.
 * @return The span.
 */
function getPreviousSpan( reference: Required< DateRange > ): PreviousSpan {
	const span = getDateRangeSpan( reference );

	if ( span?.unit === 'hour' ) {
		return { unit: 'hour', count: span.value };
	}

	return { unit: 'day', count: differenceInCalendarDays( reference.to, reference.from ) + 1 };
}

/**
 * The previous-period window, following the same whole-months branch as the
 * range math, so its name never contradicts the window it names.
 *
 * @param reference       - The applied range the comparison mirrors.
 * @param primaryPresetId - The preset the range came from.
 * @return The span.
 */
function getPreviousPeriodSpan(
	reference: Required< DateRange >,
	primaryPresetId?: PrimaryPresetId
): PreviousSpan {
	const wholeMonths = getPreviousPeriodMonthCount( reference.from, reference.to, primaryPresetId );

	if (
		wholeMonths &&
		wholeMonths >= MIN_WHOLE_MONTHS_FOR_YEARS &&
		wholeMonths % MONTHS_PER_YEAR === 0
	) {
		return { unit: 'year', count: wholeMonths / MONTHS_PER_YEAR };
	}

	if ( wholeMonths ) {
		return { unit: 'month', count: wholeMonths };
	}

	return getPreviousSpan( reference );
}

/**
 * Name a previous window in full, as the comparison menu lists it.
 *
 * @param span - The window's length.
 * @return The name.
 */
function formatPreviousSpan( span: PreviousSpan ): string {
	const { unit, count } = span;

	switch ( unit ) {
		case 'hour':
			return count === 1
				? __( 'Previous hour', 'jetpack-premium-analytics-pkg' )
				: sprintf(
						/* translators: %d: number of hours covered by the selected date range. */
						_n( 'Previous %d hour', 'Previous %d hours', count, 'jetpack-premium-analytics-pkg' ),
						count
					);
		case 'month':
			return count === 1
				? __( 'Previous month', 'jetpack-premium-analytics-pkg' )
				: sprintf(
						/* translators: %d: number of months covered by the selected date range. */
						_n( 'Previous %d month', 'Previous %d months', count, 'jetpack-premium-analytics-pkg' ),
						count
					);
		case 'year':
			return sprintf(
				/* translators: %d: number of years covered by the selected date range. */
				_n( 'Previous %d year', 'Previous %d years', count, 'jetpack-premium-analytics-pkg' ),
				count
			);
		case 'day':
			return count === 1
				? __( 'Previous day', 'jetpack-premium-analytics-pkg' )
				: sprintf(
						/* translators: %d: number of days covered by the selected date range. */
						_n( 'Previous %d day', 'Previous %d days', count, 'jetpack-premium-analytics-pkg' ),
						count
					);
		default: {
			const unhandled: never = unit;
			return unhandled;
		}
	}
}

/**
 * Name a previous window as a chart legend abbreviates it.
 *
 * @param span - The window's length.
 * @return The abbreviation.
 */
function abbreviatePreviousSpan( span: PreviousSpan ): string {
	const { unit, count } = span;

	switch ( unit ) {
		case 'hour':
			return count === 1
				? _x( 'Prev. hour', 'comparison legend label', 'jetpack-premium-analytics-pkg' )
				: sprintf(
						/* translators: %d: number of hours. Repeated after each metric in a chart legend, so keep it as short as the language allows. */
						_nx(
							'Prev. %d hour',
							'Prev. %d hours',
							count,
							'comparison legend label',
							'jetpack-premium-analytics-pkg'
						),
						count
					);
		case 'month':
			return count === 1
				? _x( 'Prev. month', 'comparison legend label', 'jetpack-premium-analytics-pkg' )
				: sprintf(
						/* translators: %d: number of months. Repeated after each metric in a chart legend, so keep it as short as the language allows. */
						_nx(
							'Prev. %d month',
							'Prev. %d months',
							count,
							'comparison legend label',
							'jetpack-premium-analytics-pkg'
						),
						count
					);
		case 'year':
			return sprintf(
				/* translators: %d: number of years. Repeated after each metric in a chart legend, so keep it as short as the language allows. */
				_nx(
					'Prev. %d year',
					'Prev. %d years',
					count,
					'comparison legend label',
					'jetpack-premium-analytics-pkg'
				),
				count
			);
		case 'day':
			return count === 1
				? _x( 'Prev. day', 'comparison legend label', 'jetpack-premium-analytics-pkg' )
				: sprintf(
						/* translators: %d: number of days. Repeated after each metric in a chart legend, so keep it as short as the language allows. */
						_nx(
							'Prev. %d day',
							'Prev. %d days',
							count,
							'comparison legend label',
							'jetpack-premium-analytics-pkg'
						),
						count
					);
		default: {
			const unhandled: never = unit;
			return unhandled;
		}
	}
}

/**
 * Label for an option, naming the comparison target rather than the offset: a
 * range set in 2025 offers "Same period in 2024".
 *
 * @param id              - The comparison preset.
 * @param reference       - The applied range.
 * @param comparison      - The resolved comparison range.
 * @param primaryPresetId - The preset the applied range came from.
 * @return The label.
 */
function getOptionLabel(
	id: ComparisonPresetId,
	reference: Required< DateRange >,
	comparison: Required< DateRange >,
	primaryPresetId?: PrimaryPresetId
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

	// No year: 52 weeks back can start in a different year than the calendar entry names.
	if ( id === COMPARISON_PREVIOUS_YEAR_MATCH_DAY_OF_WEEK ) {
		return __( 'Same period last year (match day of week)', 'jetpack-premium-analytics-pkg' );
	}

	if ( id === COMPARISON_PREVIOUS_PERIOD_MATCH_DAY_OF_WEEK ) {
		return getMatchDayOfWeekLabel( formatPreviousSpan( getPreviousSpan( reference ) ) );
	}

	return formatPreviousSpan( getPreviousPeriodSpan( reference, primaryPresetId ) );
}

/**
 * Abbreviated label for an option, as a chart legend repeats it after each
 * metric: the month or year alone where the menu names one.
 *
 * @param id              - The comparison preset.
 * @param reference       - The applied range.
 * @param comparison      - The resolved comparison range.
 * @param primaryPresetId - The preset the applied range came from.
 * @return The abbreviation.
 */
function getLegendLabel(
	id: ComparisonPresetId,
	reference: Required< DateRange >,
	comparison: Required< DateRange >,
	primaryPresetId?: PrimaryPresetId
): string {
	if ( id === COMPARISON_PREVIOUS_WEEK ) {
		/* translators: abbreviation for "Same period from last week". Repeated after each metric in a chart legend, so keep it as short as the language allows. */
		return _x( 'Prev. week', 'comparison legend label', 'jetpack-premium-analytics-pkg' );
	}

	if ( id === COMPARISON_PREVIOUS_MONTH ) {
		return getSettings().l10n.monthsShort[ comparison.from.getMonth() ];
	}

	if ( id === COMPARISON_PREVIOUS_YEAR ) {
		return String( comparison.from.getFullYear() );
	}

	if ( id === COMPARISON_PREVIOUS_YEAR_MATCH_DAY_OF_WEEK ) {
		/* translators: abbreviation for "Same period last year (match day of week)"; "weekday" says it starts on the same weekday. Repeated after each metric in a chart legend, so keep it as short as the language allows. */
		return _x( 'Prev. year, weekday', 'comparison legend label', 'jetpack-premium-analytics-pkg' );
	}

	if ( id === COMPARISON_PREVIOUS_PERIOD_MATCH_DAY_OF_WEEK ) {
		return sprintf(
			/* translators: %s: an abbreviated previous period, e.g. "Prev. 8 days". The suffix says it starts on the same weekday. */
			_x( '%s, weekday', 'comparison legend label', 'jetpack-premium-analytics-pkg' ),
			abbreviatePreviousSpan( getPreviousSpan( reference ) )
		);
	}

	return abbreviatePreviousSpan( getPreviousPeriodSpan( reference, primaryPresetId ) );
}

/**
 * The option a comparison preset selects, including one folded into another
 * option as an alias.
 *
 * @param options - Options from `getComparisonOptions`.
 * @param id      - The comparison preset.
 * @return The option, or undefined when no option in `options` has that id or alias.
 */
export function findComparisonOption(
	options: readonly ComparisonOption[],
	id: ComparisonPresetId
): ComparisonOption | undefined {
	return options.find( option => option.id === id || option.aliases.includes( id ) );
}

/**
 * The comparison options the given range offers, in display order. See the
 * package README for the candidate rules and alias-folding behaviour.
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

	// Weekday-aligned variants come last so a coinciding window drops them,
	// never the calendar entry the menu has always shown; display order is
	// restored below.
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
	if ( days <= MAX_DAYS_FOR_MONTH ) {
		candidates.push( COMPARISON_PREVIOUS_PERIOD_MATCH_DAY_OF_WEEK );
	}
	if ( days <= MAX_DAYS_FOR_YEAR ) {
		candidates.push( COMPARISON_PREVIOUS_YEAR_MATCH_DAY_OF_WEEK );
	}

	const offered: ComparisonOption[] = [];

	for ( const id of candidates ) {
		const range = getComparisonRangeFromPreset( reference, id, options );

		if ( ! range?.from || ! range.to ) {
			continue;
		}

		const resolved = range as Required< DateRange >;
		const duplicate = offered.find(
			option =>
				option.range.from.getTime() === resolved.from.getTime() &&
				option.range.to.getTime() === resolved.to.getTime()
		);

		if ( duplicate ) {
			duplicate.aliases.push( id );
			continue;
		}

		offered.push( {
			id,
			label: getOptionLabel( id, { from: refFrom, to: refTo }, resolved, options.primaryPresetId ),
			shortLabel: SHORT_LABELS[ id ](),
			legendLabel: getLegendLabel(
				id,
				{ from: refFrom, to: refTo },
				resolved,
				options.primaryPresetId
			),
			range: resolved,
			aliases: [],
		} );
	}

	return offered.sort(
		( a, b ) => COMPARISON_PRESETS.indexOf( a.id ) - COMPARISON_PRESETS.indexOf( b.id )
	);
}
