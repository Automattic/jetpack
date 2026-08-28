/**
 * External dependencies
 */
import {
	normalizeReportParams,
	dateToISOStringWithLocalTZ,
	localTZDate,
} from '@jetpack-premium-analytics/data';
import {
	getComparisonRangeFromPreset,
	siteTimeZone,
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
 * Derive compare_from/compare_to for the main range + preset, in the site
 * timezone: day-aligned ranges get day-aligned comparisons, rolling windows
 * mirror the exact window. Returns ISO strings with the site offset.
 */
export function deriveComparisonRange( opts: ReportParams ):
	| {
			compare_from: string;
			compare_to: string;
	  }
	| undefined {
	// Require comparison enabled + preset. `comp` is compared loosely: the
	// router JSON-parses search values, so an unquoted URL delivers number 1.
	const presetId = toComparisonPresetId( opts.compare_preset );
	if ( String( opts.comp ) !== '1' || ! presetId ) {
		return undefined;
	}

	if ( ! opts.from || ! opts.to ) {
		return undefined;
	}

	/*
	 * Same reader the picker uses, so an offset-less `from`/`to` anchors to the
	 * site zone here too — a raw instant would put a date-only deep link on UTC
	 * midnight, a different calendar day than the picker shows.
	 */
	const timezone = siteTimeZone();
	const reference = {
		from: localTZDate( opts.from, timezone ),
		to: localTZDate( opts.to, timezone ),
	};

	if ( isNaN( reference.from.getTime() ) || isNaN( reference.to.getTime() ) ) {
		return undefined;
	}

	const cmp = getComparisonRangeFromPreset( reference, presetId );
	if ( ! cmp?.from || ! cmp?.to ) {
		return undefined;
	}

	return {
		compare_from: dateToISOStringWithLocalTZ( cmp.from ),
		compare_to: dateToISOStringWithLocalTZ( cmp.to ),
	};
}
