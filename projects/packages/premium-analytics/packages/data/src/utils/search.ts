/**
 * External dependencies
 */
import {
	isSelectablePreset,
	type SelectablePresetId,
	type ComparisonPresetId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { ORDER_ATTRIBUTION_VIEWS } from '../api/report-order-attribution-summary-fetch';
import { getDefaultQueryParams } from '../defaults';
import { getDefaultIntervalForPeriod } from './interval';
import { computeDateRangeFromPreset } from './preset-date-range';
import type { DateType } from './types';
import type { FilterCondition } from '../types/filter-condition';

export type { FilterCondition };

/**
 * Re-export SelectablePresetId as PresetType for backward compatibility.
 * The canonical type now lives in `@jetpack-premium-analytics/datetime`.
 */
export type PresetType = SelectablePresetId;

type OrderAttributionView = ( typeof ORDER_ATTRIBUTION_VIEWS )[ number ];

export type IntervalType = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/*
 * ReportParams are the expected params present in the client URL.
 * They aren't meant to be the reports params
 * of the API endpoint (RequestReportOrdersParams)
 */
export type ReportParams = {
	from: string;
	to: string;
	preset?: PresetType;
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
 */
export function hasComparisonEnabled< T extends PartialComparisonFields >( p: T ) {
	return p.comp === '1' && !! p.compare_from?.trim() && !! p.compare_to?.trim();
}

type NormalizeReportParamsArgType = Omit< ReportParams, 'from' | 'to' | 'interval' | 'preset' > & {
	from?: string;
	to?: string;
	interval?: string;
	preset?: PrimaryPresetId;
};

/**
 * Returns normalized params for the report request query.
 * When no defined, it will use the defaults.
 *
 * @param {NormalizeReportParamsArgType} [search]        - URL search params.
 * @param {PresetType}                   [defaultPreset] - Override the fallback preset.
 */
export function normalizeReportParams(
	search?: NormalizeReportParamsArgType,
	defaultPreset?: PresetType
): ReportParams {
	const defaults = defaultPreset
		? getDefaultQueryParams( true, defaultPreset )
		: getDefaultQueryParams( true );

	// Preset handling:
	// - Use search.preset only if valid
	// - On fresh load (no from/to), fallback to defaults.preset
	// - If user has explicit dates but no/invalid preset,
	//   keep undefined (custom range)
	let preset: PresetType | undefined;
	if ( search?.preset && isSelectablePreset( search.preset ) ) {
		preset = search.preset;
	} else if ( ! search?.from && ! search?.to ) {
		preset = defaults.preset;
	}

	// When a valid preset is present, recalculate from/to
	// so rolling ranges like "Last 30 days" stay fresh
	// on every page load instead of using stale URL dates.
	// If the preset is valid but has no range implementation,
	// clear it to avoid silently falling back to stale dates.
	let presetRange: ReturnType< typeof computeDateRangeFromPreset >;
	if ( preset ) {
		presetRange = computeDateRangeFromPreset( preset );
		if ( ! presetRange ) {
			preset = undefined;
		}
	}

	const from = presetRange?.from ?? search?.from ?? defaults.from;
	const to = presetRange?.to ?? search?.to ?? defaults.to;

	// Calculate the interval from the resolved date range.
	const interval = getDefaultIntervalForPeriod( undefined, from, to );

	// A valid single-resource scope is a positive integer post/page ID.
	const postIdNumber = Number( search?.post_id );
	const postId = Number.isInteger( postIdNumber ) && postIdNumber > 0 ? postIdNumber : undefined;

	// Params from `search`, or fallback to defaults.
	const normalized: ReportParams = {
		from,
		to,
		interval: interval ?? defaults.interval,
		preset,
		...( typeof search?.period === 'string' ? { period: search.period } : {} ),
		date_type: search?.date_type ?? 'created',
		// Preserve the single-resource scope so detail-page widgets stay bound to
		// their post/page. Coerce to a positive integer and drop anything else
		// (non-numeric, zero, negative) so a hand-edited deep link can't push a
		// malformed post_id into downstream Stats requests.
		...( postId !== undefined ? { post_id: postId } : {} ),
	};

	// Add comparison params from search if enabled
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
