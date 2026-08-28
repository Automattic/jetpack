/**
 * External dependencies
 */
import {
	PRESET_ALL_TIME,
	isSelectablePreset,
	isYearPresetId,
	type SelectablePresetId,
	type ComparisonPresetId,
	type ComputablePresetId,
	type PrimaryPresetId,
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

/** The computable presets a report URL can carry. */
export type ReportPresetId = ComputablePresetId;

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

// Whether comparison is enabled. `comp` is compared loosely because the
// router JSON-parses search values, so an unquoted URL (hand-edited, or an
// older link builder) can deliver the number 1 instead of the string '1'.
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

	let preset: ReportPresetId | undefined;
	if (
		search?.preset &&
		( isSelectablePreset( search.preset ) || isYearPresetId( search.preset ) )
	) {
		preset = search.preset;
	} else if ( search?.preset === PRESET_ALL_TIME && search?.from && search?.to ) {
		// Only honour the URL's all-time start next to the range the section
		// wrote — it lets widgets tell all-time apart from a same-dated single year.
		preset = search.preset;
	} else if ( ! search?.from && ! search?.to ) {
		preset = defaults.preset;
	}

	// All-time preserves the URL's start (the year surface may later resolve it
	// site-specific); an unresolvable preset is cleared instead of going stale.
	let presetRange: ReturnType< typeof computeDateRangeFromPreset >;
	if ( preset ) {
		const computedRange = computeDateRangeFromPreset( preset );
		if ( computedRange ) {
			presetRange =
				preset === PRESET_ALL_TIME
					? { ...computedRange, from: search?.from ?? computedRange.from }
					: computedRange;
		} else {
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
		// Preserve the post_id scope so detail-page widgets stay bound to their
		// post; drop an invalid one so a hand-edited deep link can't reach Stats.
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

	// Only rolling presets have preset-specific interval rules. Other presets
	// derive their allowed intervals from the range, like an absent preset.
	const preset = isSelectablePreset( search.preset ) ? search.preset : undefined;
	return (
		resolveIntervalForRange( preset, search.from, search.to, search.interval ) !== search.interval
	);
}
