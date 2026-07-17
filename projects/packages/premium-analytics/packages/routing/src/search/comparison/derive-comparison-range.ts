/**
 * External dependencies
 */
import {
	normalizeReportParams,
	dateToISOStringWithLocalTZ,
	getSiteTimezone,
	localTZDate,
} from '@jetpack-premium-analytics/data';
import {
	getComparisonRangeFromPreset,
	type ComparisonPresetId,
} from '@jetpack-premium-analytics/datetime';

type ReportParams = NonNullable< Parameters< typeof normalizeReportParams >[ 0 ] >;

/**
 * Normalize URL/UI comparison preset IDs to canonical ComparisonPresetId.
 * Accepts variants with hyphen or underscore for robustness.
 *
 * @param value - Raw preset ID from URL or UI (e.g., 'previous_period' or 'previous-period')
 * @return Canonical ComparisonPresetId or undefined if invalid
 */
const toComparisonPresetId = ( value?: string ): ComparisonPresetId | undefined => {
	switch ( value ) {
		case 'previous-period':
		case 'previous_period':
			return 'previous-period';
		case 'previous-week':
		case 'previous_week':
			return 'previous-week';
		case 'previous-month':
		case 'previous_month':
			return 'previous-month';
		case 'previous-year':
		case 'previous_year':
			return 'previous-year';
		default:
			return undefined;
	}
};

/**
 * Derive compare_from/compare_to from the main range + preset,
 * honoring the site's timezone via existing data utils.
 *
 * Rules:
 * - Only derive when comparison is enabled (comp === "1") AND a preset is present.
 * - The main range is interpreted in the site timezone; day-aligned ranges get
 *   day-aligned comparisons, sub-day rolling windows are mirrored exactly.
 * - Return ISO strings WITH site offset (same format you write to the URL).
 */
export function deriveComparisonRange( opts: ReportParams ):
	| {
			compare_from: string;
			compare_to: string;
	  }
	| undefined {
	// Require comparison enabled + preset
	const presetId = toComparisonPresetId( opts.compare_preset );
	if ( opts.comp !== '1' || ! presetId ) {
		return undefined;
	}

	// Need valid main range
	if ( ! opts.from || ! opts.to ) {
		return undefined;
	}

	// Parse URL params (ISO+offset) to instants
	const fromInstant = new Date( opts.from );
	const toInstant = new Date( opts.to );
	if ( isNaN( fromInstant.getTime() ) || isNaN( toInstant.getTime() ) ) {
		return undefined;
	}

	/*
	 * Interpret the instants in the site timezone so day boundaries resolve
	 * site-locally. Day-aligned ranges keep day-aligned comparisons; rolling
	 * windows (e.g. last-24-hours) mirror the exact window.
	 */
	const timezone = getSiteTimezone();
	const reference = {
		from: localTZDate( fromInstant.getTime(), timezone ),
		to: localTZDate( toInstant.getTime(), timezone ),
	};

	// Compute comparison range (Dates)
	const cmp = getComparisonRangeFromPreset( reference, presetId );
	if ( ! cmp?.from || ! cmp?.to ) {
		return undefined;
	}

	// Serialize back to ISO with site offset (string-to-string stable)
	return {
		compare_from: dateToISOStringWithLocalTZ( cmp.from ),
		compare_to: dateToISOStringWithLocalTZ( cmp.to ),
	};
}
