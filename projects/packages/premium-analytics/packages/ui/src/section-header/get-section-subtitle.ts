/**
 * External dependencies
 */
import {
	getComparisonPresetLabel,
	isYearSurfacePresetId,
	type ComparisonPresetId,
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
};

/**
 * Spell out a range's length, e.g. "7 days".
 *
 * @param span - The measured span.
 * @return The localized length.
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
 * getSectionSubtitle( { range } )  // 'Tuesday, July 21 – Monday, July 27 (7 days)'
 *                                  // with comparison: '… (7 days) vs. Previous period'
 *                                  // year surface: 'January 1, 2021 – July 30, 2026'
 *
 * @param args                    - The applied date configuration.
 * @param args.range              - The applied date range.
 * @param args.comparisonPresetId - The applied comparison preset, when active.
 * @param args.presetId           - The applied primary preset, when there is one.
 * @return The subtitle, or undefined when the range is incomplete.
 */
export function getSectionSubtitle( {
	range,
	comparisonPresetId,
	presetId,
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
	const dateConfiguration = span
		? sprintf(
				// translators: %1$s is a date range, %2$s is how long it is, e.g. "7 days".
				__( '%1$s (%2$s)', 'jetpack-premium-analytics-pkg' ),
				rangeLabel,
				getSpanLabel( span )
		  )
		: rangeLabel;

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
