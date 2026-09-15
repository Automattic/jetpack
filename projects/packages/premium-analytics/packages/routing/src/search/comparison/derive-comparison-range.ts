/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import {
	dateToISOStringWithLocalTZ,
	getComparisonOptions,
	isComparisonPresetId,
	isPrimaryPreset,
	localTZDate,
	reportingTimeZone,
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
	const normalized = value?.replace( /_/g, '-' );
	return isComparisonPresetId( normalized ) ? normalized : undefined;
};

/**
 * Resolve the comparison params for the main range, in the site timezone: the
 * active preset where the range still offers it, else the previous period, so
 * a range change never strands a comparison the picker cannot name. The primary
 * preset travels along, so a to-date preset's previous period is its previous
 * whole period rather than a day count. Returns ISO strings with the site
 * offset, plus the preset they came from.
 *
 * @param opts - Report params carrying the main range and comparison state.
 * @return The comparison params, or undefined when comparison is off or the range unreadable.
 */
export function deriveComparisonRange( opts: ReportParams ):
	| {
			compare_from: string;
			compare_to: string;
			compare_preset: ComparisonPresetId;
	  }
	| undefined {
	// Loose `comp` check: the router JSON-parses search values, so an unquoted
	// URL delivers number 1 instead of the string '1'.
	if ( String( opts.comp ) !== '1' || ! opts.from || ! opts.to ) {
		return undefined;
	}

	/*
	 * Same reader the picker uses, so an offset-less `from`/`to` anchors to the
	 * site zone here too — a raw instant would put a date-only deep link on UTC
	 * midnight, a different calendar day than the picker shows.
	 */
	const timezone = reportingTimeZone();
	const reference = {
		from: localTZDate( opts.from, timezone ),
		to: localTZDate( opts.to, timezone ),
	};

	if ( isNaN( reference.from.getTime() ) || isNaN( reference.to.getTime() ) ) {
		return undefined;
	}

	const options = getComparisonOptions( reference, {
		primaryPresetId: isPrimaryPreset( opts.preset ) ? opts.preset : undefined,
	} );
	const presetId = toComparisonPresetId( opts.compare_preset );

	// A preset the range doesn't offer — or an id from an old link — falls back
	// to the previous period, which every range offers, so the comparison
	// intent survives a range change.
	const option =
		options.find( candidate => candidate.id === presetId ) ??
		options.find( candidate => candidate.id === 'previous-period' );

	if ( ! option ) {
		return undefined;
	}

	return {
		compare_from: dateToISOStringWithLocalTZ( option.range.from ),
		compare_to: dateToISOStringWithLocalTZ( option.range.to ),
		compare_preset: option.id,
	};
}
