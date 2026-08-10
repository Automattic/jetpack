/**
 * External dependencies
 */
import {
	getComparisonPresetLabel,
	isYearSurfacePresetId,
	type ComparisonPresetId,
	type IntervalType,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import {
	formatDateRangeLong,
	getDateRangeSpan,
	type DateRangeSpan,
} from '@jetpack-premium-analytics/formatters';
import { __, _n, sprintf } from '@wordpress/i18n';

type SectionSubtitleArgs = {
	/**
	 * The applied date range, not the picker's staged draft.
	 */
	range?: { from?: Date; to?: Date };

	/**
	 * The applied comparison preset, when a comparison is active.
	 */
	comparisonPresetId?: ComparisonPresetId;

	/**
	 * The applied primary preset. Only read to recognise the year surface,
	 * whose length is not a property of the selection.
	 */
	presetId?: PrimaryPresetId;

	/**
	 * The applied chart interval. Omit it on a surface carrying no interval
	 * control, so the subtitle never states a bucket the reader cannot change.
	 */
	interval?: IntervalType;
};

/**
 * Spell out a range's length, e.g. "7 days".
 */
function getSpanLabel( span: DateRangeSpan ): string {
	switch ( span.unit ) {
		case 'hour':
			return sprintf(
				// translators: %d is a number of hours.
				_n( '%d hour', '%d hours', span.value, 'jetpack-premium-analytics-pkg' ),
				span.value
			);
		case 'month':
			return sprintf(
				// translators: %d is a number of months.
				_n( '%d month', '%d months', span.value, 'jetpack-premium-analytics-pkg' ),
				span.value
			);
		case 'year':
			return sprintf(
				// translators: %d is a number of years.
				_n( '%d year', '%d years', span.value, 'jetpack-premium-analytics-pkg' ),
				span.value
			);
		default:
			return sprintf(
				// translators: %d is a number of days.
				_n( '%d day', '%d days', span.value, 'jetpack-premium-analytics-pkg' ),
				span.value
			);
	}
}

/**
 * Name the interval as a cadence, e.g. "daily".
 *
 * A cadence rather than the menu's "By days": the window length sits beside it
 * in the same units, where "(24 hours, by hours)" reads as a stutter.
 *
 * @param interval - The applied bucket.
 * @return The localized cadence.
 */
function getIntervalCadenceLabel( interval: IntervalType ): string {
	switch ( interval ) {
		case 'hour':
			return __( 'hourly', 'jetpack-premium-analytics-pkg' );
		case 'day':
			return __( 'daily', 'jetpack-premium-analytics-pkg' );
		case 'week':
			return __( 'weekly', 'jetpack-premium-analytics-pkg' );
		case 'month':
			return __( 'monthly', 'jetpack-premium-analytics-pkg' );
		case 'quarter':
			return __( 'quarterly', 'jetpack-premium-analytics-pkg' );
		case 'year':
			return __( 'yearly', 'jetpack-premium-analytics-pkg' );
	}
}

/**
 * Describe the applied date configuration for a section header subtitle.
 *
 * Reads the applied range rather than the preset, so a window stepped back off
 * a preset still describes its own length.
 *
 * The year surface is the exception, and carries no length. `All time` and the
 * running year both start on a calendar boundary and end at the end of today,
 * so their length grows by a day at a time and measuring it reports the shape
 * of today's date rather than of the selection. Left to the measurement, one
 * site reads "2037 days" mid-month, "67 months" on the last day of one, and "6
 * years" on December 31, and the range itself reformats along with the unit.
 * Past years measure consistently, but their label already names the year, so
 * "(12 months)" adds nothing and the whole surface is treated alike.
 *
 * @example
 * getSectionSubtitle( { range, interval } )
 *   // 'Tuesday, July 21 – Monday, July 27 (7 days, daily)'
 *   // with comparison: '… (7 days, daily) vs. Previous period'
 *   // year surface: 'January 1, 2021 – July 30, 2026 (quarterly)'
 *
 * @return The subtitle, or undefined when the range is incomplete.
 */
export function getSectionSubtitle( {
	range,
	comparisonPresetId,
	presetId,
	interval,
}: SectionSubtitleArgs ): string | undefined {
	/*
	 * The year surface is described by its selection, not by measuring it: both
	 * the length and the range's own shape follow the measured unit, and for a
	 * still-running year that unit changes by the day.
	 */
	const isYearSurface = isYearSurfacePresetId( presetId );
	const rangeLabel = formatDateRangeLong( range, { calendarScale: isYearSurface } );

	if ( ! rangeLabel ) {
		return undefined;
	}

	const span = isYearSurface ? null : getDateRangeSpan( range );

	/*
	 * The parenthetical holds how long the window is and how the charts bucket
	 * it. Either can be absent, so the shapes are spelled out as whole format
	 * strings rather than joined, leaving the separator to translators.
	 */
	const details = [
		span ? getSpanLabel( span ) : null,
		interval ? getIntervalCadenceLabel( interval ) : null,
	].filter( ( detail ): detail is string => detail !== null );

	let dateConfiguration = rangeLabel;

	if ( details.length === 2 ) {
		dateConfiguration = sprintf(
			// translators: %1$s is a date range, %2$s is how long it is, e.g. "7 days", %3$s is the chart interval, e.g. "daily".
			__( '%1$s (%2$s, %3$s)', 'jetpack-premium-analytics-pkg' ),
			rangeLabel,
			details[ 0 ],
			details[ 1 ]
		);
	} else if ( details.length === 1 ) {
		dateConfiguration = sprintf(
			// translators: %1$s is a date range, %2$s is either how long it is, e.g. "7 days", or the chart interval, e.g. "daily".
			__( '%1$s (%2$s)', 'jetpack-premium-analytics-pkg' ),
			rangeLabel,
			details[ 0 ]
		);
	}

	const comparisonLabel = comparisonPresetId
		? getComparisonPresetLabel( comparisonPresetId )
		: null;

	if ( ! comparisonLabel ) {
		return dateConfiguration;
	}

	return sprintf(
		// translators: %1$s is a date range with its length, %2$s is the compared period, e.g. "Previous period".
		__( '%1$s vs. %2$s', 'jetpack-premium-analytics-pkg' ),
		dateConfiguration,
		comparisonLabel
	);
}
