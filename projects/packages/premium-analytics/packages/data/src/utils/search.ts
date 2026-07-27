/**
 * External dependencies
 */
import {
	isComputablePreset,
	isPrimaryPreset,
	PRESET_ALL_TIME,
	type ComputablePresetId,
	type SelectablePresetId,
	type ComparisonPresetId,
	type PrimaryPresetId,
	type YearSurfaceOptions,
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

type OrderAttributionView = ( typeof ORDER_ATTRIBUTION_VIEWS )[ number ];

/*
 * ReportParams are the expected params present in the client URL.
 * They aren't meant to be the reports params
 * of the API endpoint (RequestReportOrdersParams)
 */
export type ReportParams = {
	from: string;
	to: string;
	/**
	 * Any preset whose range is computable from its ID, so the window can be
	 * a rolling one or a year-surface selection. Wider than `PresetType`, which
	 * still means "one of the fixed rolling windows" for callers that pick a
	 * default.
	 */
	preset?: ComputablePresetId;
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

/**
 * Leading calendar year of an ISO date string.
 */
const ISO_YEAR_PATTERN = /^(\d{4})-/;

/**
 * Year surface options for a preset about to be recomputed.
 *
 * Only `all-time` reads them: its start is a property of the surface that wrote
 * the URL rather than of the ID, so the year is read back out of the `from` that
 * surface produced. That keeps the window a widget resolves identical to the one
 * the surface shows, however far back the surface reaches. Without a usable
 * `from`, the computation falls back to its own default.
 *
 * Read off the string rather than off a parsed date on purpose. The surface
 * writes January 1 in the site's timezone, so the leading year is already the
 * answer; parsing would reinterpret that instant in whatever timezone the site
 * has now, and one that moved zones since the link was made would land on
 * December 31 of the year before.
 *
 * @param preset - The preset being resolved.
 * @param from   - The `from` search param, if any.
 * @return Options to forward to the range computation.
 */
function resolveYearSurfaceOptions(
	preset: ComputablePresetId,
	from?: string
): YearSurfaceOptions {
	const startYear = preset === PRESET_ALL_TIME ? ISO_YEAR_PATTERN.exec( from ?? '' ) : null;

	return startYear ? { startYear: Number( startYear[ 1 ] ) } : {};
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

/**
 * Returns normalized params for the report request query.
 * When no defined, it will use the defaults.
 *
 * @param {NormalizeReportParamsArgType} [search]        - Candidate report params.
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
	let preset: ComputablePresetId | undefined;
	if ( search?.preset && isComputablePreset( search.preset ) ) {
		preset = search.preset;
	} else if ( ! search?.from && ! search?.to ) {
		preset = defaults.preset;
	}

	// When a valid preset is present, recalculate from/to
	// so rolling ranges like "Last 30 days" stay fresh
	// on every page load instead of using stale URL dates.
	// The year surface needs it too: all time and the current
	// year both end today, so a link followed the next day
	// would otherwise stop at the day it was created.
	// If the preset is valid but has no range implementation,
	// clear it to avoid silently falling back to stale dates.
	let presetRange: ReturnType< typeof computeDateRangeFromPreset >;
	if ( preset ) {
		presetRange = computeDateRangeFromPreset(
			preset,
			resolveYearSurfaceOptions( preset, search?.from )
		);
		if ( ! presetRange ) {
			preset = undefined;
		}
	}

	const from = presetRange?.from ?? search?.from ?? defaults.from;
	const to = presetRange?.to ?? search?.to ?? defaults.to;

	const interval = resolveIntervalForRange( preset, from, to, search?.interval );

	const postId = toPostId( search?.post_id );

	// Params from `search`, or fallback to defaults.
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

/**
 * Whether report date params are incomplete or the interval is invalid for the range.
 *
 * @param search - Candidate report date-window fields.
 * @return True when `from`, `to`, or `interval` is missing, or `interval` is not allowed for the range.
 */
export function needsReportDateParamsSeed( search?: ReportDateWindowSearch ): boolean {
	if ( ! search?.from || ! search?.to || ! search?.interval ) {
		return true;
	}

	const preset = isPrimaryPreset( search.preset ) ? search.preset : undefined;
	return (
		resolveIntervalForRange( preset, search.from, search.to, search.interval ) !== search.interval
	);
}
