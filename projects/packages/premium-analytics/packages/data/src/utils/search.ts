/**
 * External dependencies
 */
import {
	PRESET_ALL_TIME,
	isSelectablePreset,
	isYearPresetId,
	isYearSurfacePresetId,
	type SelectablePresetId,
	type ComparisonPresetId,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { ORDER_ATTRIBUTION_VIEWS } from '../api/report-order-attribution-summary-fetch';
import { getDefaultQueryParams } from '../defaults';
import { resolveIntervalForRange, type IntervalType } from './interval';
import { computeDateRangeFromPreset } from './preset-date-range';
import { toPostId } from './to-post-id';
import type { DateType } from './types';
import type { FilterCondition } from '../types/filter-condition';

export type { FilterCondition };
export type { IntervalType };

/**
 * Re-export SelectablePresetId as PresetType for backward compatibility.
 * The canonical type now lives in `@jetpack-premium-analytics/datetime`.
 */
export type PresetType = SelectablePresetId;

/**
 * The presets a report URL can carry: the rolling windows every section offers,
 * plus the year surface a section can offer instead (all time, or one calendar
 * year — see `Dashboard_Section::DATE_FILTER_YEAR`).
 */
export type ReportPresetId = PresetType | YearSurfacePresetId;

type OrderAttributionView = ( typeof ORDER_ATTRIBUTION_VIEWS )[ number ];

/*
 * ReportParams are the expected params present in the client URL.
 * They aren't meant to be the reports params
 * of the API endpoint (RequestReportOrdersParams)
 */
export type ReportParams = {
	from: string;
	to: string;
	preset?: ReportPresetId;
	interval: IntervalType;
	period?: string;
	compare_from?: string;
	compare_to?: string;
	compare_preset?: ComparisonPresetId;
	comp?: '1';
	view?: OrderAttributionView; // For order attribution reports
	filters?: FilterCondition[];
	section?: string;
	date_type?: DateType; // For filtering by different date fields (created, paid, completed)
	post_id?: string | number; // Scopes a report to a single post/page (detail page). String from the URL; numeric at the query layer.
};

type PartialComparisonFields = Partial<
	Pick< ReportParams, 'comp' | 'compare_from' | 'compare_to' >
>;

/*
 * Checks if the comparison is present in the search params.
 *
 * `comp` is compared loosely: the router JSON-parses search values, so a URL
 * written without JSON quoting (hand-edited, or by an older link builder)
 * delivers the number 1 instead of the string '1'.
 */
export function hasComparisonEnabled< T extends PartialComparisonFields >( p: T ) {
	return String( p.comp ) === '1' && !! p.compare_from?.trim() && !! p.compare_to?.trim();
}

type NormalizeReportParamsArgType = Omit< ReportParams, 'from' | 'to' | 'interval' | 'preset' > & {
	from?: string;
	to?: string;
	interval?: string;
	preset?: PrimaryPresetId;
};

/**
 * Unnormalized date-window fields from report search params.
 */
type ReportDateWindowSearch = Pick<
	NormalizeReportParamsArgType,
	'from' | 'to' | 'interval' | 'preset'
>;

/** Returns normalized report params, falling back to the defaults for anything absent. */
export function normalizeReportParams(
	search?: NormalizeReportParamsArgType,
	defaultPreset?: PresetType
): ReportParams {
	const defaults = defaultPreset
		? getDefaultQueryParams( true, defaultPreset )
		: getDefaultQueryParams( true );

	// Preset handling:
	// - Use search.preset only if valid
	// - Recompute a year preset from its ID; carry all time only with its URL range
	// - On fresh load (no from/to), fallback to defaults.preset
	// - If user has explicit dates but no/invalid preset,
	//   keep undefined (custom range)
	let preset: ReportPresetId | undefined;
	if (
		search?.preset &&
		( isSelectablePreset( search.preset ) || isYearPresetId( search.preset ) )
	) {
		preset = search.preset;
	} else if ( search?.preset === PRESET_ALL_TIME && search?.from && search?.to ) {
		/*
		 * All time starts at the site's first listed year, which this layer cannot
		 * resolve, so it is only honoured next to the range the section wrote.
		 * Keeping the marker lets widgets distinguish it from a single year when
		 * both ranges happen to cover the same dates.
		 */
		preset = search.preset;
	} else if ( ! search?.from && ! search?.to ) {
		preset = defaults.preset;
	}

	// Recalculate rolling and per-year presets so their ranges stay fresh on
	// every page load instead of using stale URL dates. The current calendar
	// year's end moves with today just like a rolling range does.
	// If the preset is valid but has no range implementation,
	// clear it to avoid silently falling back to stale dates.
	// All time is skipped because its start depends on the site's first year.
	let presetRange: ReturnType< typeof computeDateRangeFromPreset >;
	if ( preset && ( isSelectablePreset( preset ) || isYearPresetId( preset ) ) ) {
		presetRange = computeDateRangeFromPreset( preset );
		if ( ! presetRange ) {
			preset = undefined;
		}
	}

	const from = presetRange?.from ?? search?.from ?? defaults.from;
	const to = presetRange?.to ?? search?.to ?? defaults.to;

	const interval = resolveIntervalForRange( preset, from, to, search?.interval );

	const postId = toPostId( search?.post_id );

	const normalized: ReportParams = {
		from,
		to,
		interval,
		preset,
		...( typeof search?.period === 'string' ? { period: search.period } : {} ),
		date_type: search?.date_type ?? 'created',
		// Preserve the single-resource scope so detail-page widgets stay bound to
		// their post/page, dropping an invalid one so a hand-edited deep link can't
		// push a malformed post_id into downstream Stats requests.
		...( postId > 0 ? { post_id: postId } : {} ),
	};

	if ( search && hasComparisonEnabled( search ) ) {
		normalized.compare_from = search.compare_from;
		normalized.compare_to = search.compare_to;
		normalized.compare_preset = search.compare_preset;
		normalized.comp = '1';
	} else if ( ! search?.from && hasComparisonEnabled( defaults ) ) {
		// Fresh load (missing primary params) - apply default comparison
		normalized.compare_from = defaults.compare_from;
		normalized.compare_to = defaults.compare_to;
		normalized.compare_preset = defaults.compare_preset;
		normalized.comp = '1';
	}

	return normalized;
}

/**
 * Whether report date params are incomplete or the interval is invalid for the range.
 */
export function needsReportDateParamsSeed( search?: ReportDateWindowSearch ): boolean {
	if ( ! search?.from || ! search?.to || ! search?.interval ) {
		return true;
	}

	// Accept the same preset IDs as `normalizeReportParams`. Year-surface presets
	// currently derive their intervals from the range, like an absent preset.
	const preset =
		isSelectablePreset( search.preset ) || isYearSurfacePresetId( search.preset )
			? search.preset
			: undefined;
	return (
		resolveIntervalForRange( preset, search.from, search.to, search.interval ) !== search.interval
	);
}
