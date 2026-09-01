/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	startOfDay,
	endOfDay,
	startOfHour,
	endOfHour,
	subDays,
	subHours,
	subMonths,
	subYears,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
} from 'date-fns';
/**
 * Internal dependencies
 */
import { createTZDateFromParts, toLocalTZ } from '../tz';
import {
	PRESET_TODAY,
	PRESET_YESTERDAY,
	PRESET_LAST_24_HOURS,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_MONTH,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
	PRESET_CUSTOM,
	PRESET_ALL_TIME,
	QUICK_SURFACE_PRESETS,
	getPresetYear,
	isYearSurfacePresetId,
	toYearPresetId,
	type ComputablePresetId,
	type QuickSurfacePresetId,
	type SelectablePresetId,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from './types';
import type { DateRange } from '../get-comparison-range';

/**
 * Shared date calculations used by multiple presets.
 */
type DateContext = {
	now: Date;
	initOfToday: Date;
	endOfToday: Date;
	endOfYesterday: Date;
	lastMonth: Date;
	endOfLastMonth: Date;
	lastYear: Date;
	timeZone: string;
};

/**
 * Years listed on the year surface when the caller doesn't pass a start year.
 */
export const DEFAULT_YEAR_SURFACE_COUNT = 6;

type PresetDefinition = {
	id: SelectablePresetId;
	getLabel: () => string;
	/**
	 * Compressed label for the surface pills, where the row cannot afford the
	 * preset's full name. Only the quick surface presets carry one.
	 */
	getPillLabel?: () => string;
	/**
	 * Short label for the surface pills. Only the quick surface presets carry
	 * one: they are the only presets rendered in a fixed-width row. Translated
	 * separately rather than truncated, since the English forms are initials.
	 */
	getShortLabel?: () => string;
	getRange: ( ctx: DateContext ) => Required< DateRange >;
};

/**
 * Canonical preset definitions. Labels are defined once here and reused by all
 * consumers.
 */
export const PRESET_DEFINITIONS: ReadonlyArray< PresetDefinition > = [
	{
		id: PRESET_TODAY,
		getLabel: () => __( 'Today', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfToday } ) => ( {
			from: initOfToday,
			to: endOfToday,
		} ),
	},
	{
		id: PRESET_YESTERDAY,
		getLabel: () => __( 'Yesterday', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 1 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_24_HOURS,
		getLabel: () => __( 'Last 24 hours', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "Last 24 hours". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
			_x( '24H', 'short date range preset', 'jetpack-premium-analytics-pkg' ),
		// Snapped to the hour rather than the raw instant: the range is sent
		// verbatim and forms part of the request's React Query key, so off a raw
		// `now` identical requests never dedupe or hit the cache.
		//
		// `subHours` counts elapsed time, so the window spans 24 real hours even
		// across a DST transition.
		getRange: ( { now } ) => ( {
			from: subHours( startOfHour( now ), 23 ),
			to: endOfHour( now ),
		} ),
	},
	{
		id: PRESET_LAST_7_DAYS,
		getLabel: () => __( 'Last 7 days', 'jetpack-premium-analytics-pkg' ),
		getPillLabel: () =>
			/* translators: Rolling date-range preset pill. The last 7 days; keep it short. */
			__( '7 days', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "7 days". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
			_x( '7D', 'short date range preset', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 7 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_30_DAYS,
		getLabel: () => __( 'Last 30 days', 'jetpack-premium-analytics-pkg' ),
		getPillLabel: () =>
			/* translators: Rolling date-range preset pill. The last 30 days; keep it short. */
			__( '30 days', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "30 days". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
			_x( '30D', 'short date range preset', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 30 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_90_DAYS,
		getLabel: () => __( 'Last 90 days', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 90 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_365_DAYS,
		getLabel: () => __( 'Last 365 days', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 365 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_MONTH,
		getLabel: () => __( 'Last month', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { lastMonth, endOfLastMonth } ) => ( {
			from: startOfMonth( lastMonth ),
			to: endOfLastMonth,
		} ),
	},
	{
		id: PRESET_LAST_12_MONTHS,
		getLabel: () => __( 'Last 12 months', 'jetpack-premium-analytics-pkg' ),
		getPillLabel: () =>
			/* translators: Rolling date-range preset pill. The last 12 months; keep it short. */
			__( '12 months', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "12 months". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
			_x( '12M', 'short date range preset', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subMonths( initOfToday, 12 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_YEAR,
		getLabel: () => __( 'Last year', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { lastYear } ) => ( {
			from: startOfYear( lastYear ),
			to: endOfYear( lastYear ),
		} ),
	},
];

/**
 * Label for a year-surface preset. Years are shown as the bare number, so only
 * the all-time entry is translated.
 *
 * @param id - A year-surface preset identifier.
 * @return The preset label.
 */
function getYearSurfaceLabel( id: YearSurfacePresetId ): string {
	return id === PRESET_ALL_TIME ? getAllTimeLabel() : String( getPresetYear( id ) );
}

/**
 * The all-time preset's label, shared by the year surface and the quick surface.
 *
 * @return The translated label.
 */
function getAllTimeLabel(): string {
	return __( 'All time', 'jetpack-premium-analytics-pkg' );
}

/**
 * The all-time preset's abbreviated label, for a quick surface too narrow for
 * the full one.
 *
 * @return The translated short label.
 */
function getAllTimeShortLabel(): string {
	/* translators: abbreviation for "All time". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
	return _x( 'All', 'short date range preset', 'jetpack-premium-analytics-pkg' );
}

/**
 * Get the label for a preset without calculating date ranges.
 *
 * @param id - The preset identifier
 * @return The preset label, or null if not found or custom
 */
export function getPresetLabel( id: PrimaryPresetId | null | undefined ): string | null {
	if ( ! id || id === PRESET_CUSTOM ) {
		return null;
	}

	if ( isYearSurfacePresetId( id ) ) {
		return getYearSurfaceLabel( id );
	}

	const preset = PRESET_DEFINITIONS.find( p => p.id === id );
	return preset?.getLabel() ?? null;
}

/**
 * Build a DateContext for a given timezone.
 * @param timeZone
 */
function buildDateContext( timeZone: string ): DateContext {
	const nowWithTZ = toLocalTZ( undefined, timeZone );
	const initOfToday = startOfDay( nowWithTZ );
	const endOfToday = endOfDay( nowWithTZ );
	const endOfYesterday = endOfDay( subDays( initOfToday, 1 ) );
	const lastMonth = subMonths( initOfToday, 1 );
	const endOfLastMonth = endOfMonth( lastMonth );
	const lastYear = subYears( initOfToday, 1 );

	return {
		now: nowWithTZ,
		initOfToday,
		endOfToday,
		endOfYesterday,
		lastMonth,
		endOfLastMonth,
		lastYear,
		timeZone,
	};
}

/**
 * Preset ranges always have both `from` and `to` defined.
 */
export type DateRangePreset< TId extends ComputablePresetId = SelectablePresetId > = {
	id: TId;
	label: string;
	/**
	 * The pill row's own form of the name, present only where the row cannot
	 * afford the full one. A surface with room reads `label`.
	 */
	pillLabel?: string;
	/**
	 * Abbreviated label, present only on presets that render as surface pills.
	 * Consumers that never run out of room can ignore it.
	 */
	shortLabel?: string;
	range: Required< DateRange >;
};

/**
 * Resolve the oldest year the year surface covers. Anything past the current
 * year is clamped: the surface can't offer a year that hasn't started.
 *
 * @param startYear - Caller-provided start year, if any.
 * @param ctx       - The date context.
 * @return The oldest year to list.
 */
function resolveStartYear( startYear: number | undefined, ctx: DateContext ): number {
	const currentYear = ctx.now.getFullYear();

	if ( ! Number.isInteger( startYear ) ) {
		return currentYear - ( DEFAULT_YEAR_SURFACE_COUNT - 1 );
	}

	return Math.min( startYear, currentYear );
}

/**
 * Range covering one calendar year. The current year stops at the end of today
 * rather than at a December that hasn't happened yet, so charts aren't padded
 * with empty future days.
 *
 * @param year - Four-digit year.
 * @param ctx  - The date context.
 * @return The year's range.
 */
function computeYearRange( year: number, ctx: DateContext ): Required< DateRange > {
	const from = createTZDateFromParts( [ year, 0, 1 ], ctx.timeZone );
	const to = endOfYear( from );

	return { from, to: to > ctx.endOfToday ? ctx.endOfToday : to };
}

/**
 * The all-time range, through the end of today. From the start of the oldest
 * year the year surface lists, or from the site-local start of a resource's own
 * first day when the caller anchors it there.
 *
 * @param start - The oldest year listed, or the instant the range starts from.
 * @param ctx   - The date context.
 * @return The all-time range.
 */
function computeAllTimeRange( start: number | Date, ctx: DateContext ): Required< DateRange > {
	return {
		from:
			start instanceof Date
				? startOfDay( toLocalTZ( start, ctx.timeZone ) )
				: createTZDateFromParts( [ start, 0, 1 ], ctx.timeZone ),
		to: ctx.endOfToday,
	};
}

/**
 * Where the all-time range starts for the given options: the anchored date when
 * there is one, else the year surface's oldest year.
 *
 * @param options - The all-time options.
 * @param ctx     - The date context.
 * @return The start to compute the range from.
 */
function resolveAllTimeStart( options: AllTimeRangeOptions, ctx: DateContext ): number | Date {
	return options.startDate ?? resolveStartYear( options.startYear, ctx );
}

/**
 * Get the default date range presets with computed ranges.
 *
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @return The default date range presets.
 */
export function getDefaultDateRangePresets( timeZone: string ): DateRangePreset[] {
	const ctx = buildDateContext( timeZone );

	return PRESET_DEFINITIONS.map( ( { id, getLabel, getPillLabel, getShortLabel, getRange } ) => ( {
		id,
		label: getLabel(),
		pillLabel: getPillLabel?.(),
		shortLabel: getShortLabel?.(),
		range: getRange( ctx ),
	} ) );
}

/**
 * Options of the quick surface: which pills it shows, and where its all-time
 * pill starts.
 */
export type QuickSurfaceOptions = AllTimeRangeOptions & {
	/**
	 * The presets to render, in display order. Defaults to the rolling windows
	 * of `QUICK_SURFACE_PRESETS`; a detail page passes `DETAIL_SURFACE_PRESETS`
	 * to lead with all time.
	 */
	presetIds?: readonly QuickSurfacePresetId[];
};

/**
 * Presets for the date-range filter surface pills: the rolling windows, and all
 * time where the surface lists it.
 *
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @param options  - Which presets to list, and the all-time anchor.
 * @return Quick surface presets in display order.
 */
export function getQuickSurfacePresets(
	timeZone: string,
	options: QuickSurfaceOptions = {}
): DateRangePreset< QuickSurfacePresetId >[] {
	const ctx = buildDateContext( timeZone );
	const presetsById = new Map< QuickSurfacePresetId, DateRangePreset< QuickSurfacePresetId > >(
		getDefaultDateRangePresets( timeZone ).map( preset => [ preset.id, preset ] )
	);
	presetsById.set( PRESET_ALL_TIME, {
		id: PRESET_ALL_TIME,
		label: getAllTimeLabel(),
		shortLabel: getAllTimeShortLabel(),
		range: computeAllTimeRange( resolveAllTimeStart( options, ctx ), ctx ),
	} );

	return ( options.presetIds ?? QUICK_SURFACE_PRESETS )
		.map( id => presetsById.get( id ) )
		.filter(
			( preset ): preset is DateRangePreset< QuickSurfacePresetId > => preset !== undefined
		);
}

/**
 * Where the all-time range starts. A surface passes one of the two: the year
 * surface its oldest listed year, a resource detail page the resource's own
 * start.
 */
export type AllTimeRangeOptions = {
	/**
	 * Oldest year to cover. Doubles as the start of the all-time range, so both
	 * stay in step with what the year surface shows. Defaults to
	 * `DEFAULT_YEAR_SURFACE_COUNT` years back.
	 */
	startYear?: number;

	/**
	 * The instant all time starts from, e.g. a post's publish date. The range
	 * starts at the site-local start of that day. Takes precedence over
	 * `startYear`.
	 */
	startDate?: Date;
};

/**
 * Options shared by the year surface and its range calculations.
 */
export type YearSurfaceOptions = Pick< AllTimeRangeOptions, 'startYear' >;

/**
 * All-time and per-year presets for the year filter surface, newest year first.
 *
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @param options  - Year surface options.
 * @return Year surface presets in display order.
 */
export function getYearSurfacePresets(
	timeZone: string,
	options: YearSurfaceOptions = {}
): DateRangePreset< YearSurfacePresetId >[] {
	const ctx = buildDateContext( timeZone );
	const firstYear = resolveStartYear( options.startYear, ctx );
	const currentYear = ctx.now.getFullYear();

	const years: DateRangePreset< YearSurfacePresetId >[] = [];
	for ( let year = currentYear; year >= firstYear; year-- ) {
		years.push( {
			id: toYearPresetId( year ),
			label: getYearSurfaceLabel( toYearPresetId( year ) ),
			range: computeYearRange( year, ctx ),
		} );
	}

	return [
		{
			id: PRESET_ALL_TIME,
			label: getYearSurfaceLabel( PRESET_ALL_TIME ),
			range: computeAllTimeRange( firstYear, ctx ),
		},
		...years,
	];
}

/**
 * Compute the absolute date range for a preset ID in the given timezone.
 *
 * @param presetId - A valid computable preset identifier.
 * @param timeZone - IANA timezone string.
 * @param options  - All-time options; only read for the all-time preset,
 *                 whose start is a property of the surface, not of the ID.
 * @return The computed range, or undefined if the preset is not recognized.
 */
export function computePrimaryRange(
	presetId: ComputablePresetId,
	timeZone: string,
	options: AllTimeRangeOptions = {}
): Required< DateRange > | undefined {
	const ctx = buildDateContext( timeZone );

	if ( presetId === PRESET_ALL_TIME ) {
		return computeAllTimeRange( resolveAllTimeStart( options, ctx ), ctx );
	}

	const year = getPresetYear( presetId );
	if ( year !== null ) {
		return computeYearRange( year, ctx );
	}

	return PRESET_DEFINITIONS.find( p => p.id === presetId )?.getRange( ctx );
}
