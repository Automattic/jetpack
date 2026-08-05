/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	startOfDay,
	endOfDay,
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

/**
 * Preset definition with label getter and range calculator.
 */
type PresetDefinition = {
	id: SelectablePresetId;
	getLabel: () => string;
	/**
	 * Short label for the surface pills. Only the quick surface presets carry
	 * one: they are the only presets rendered in a fixed-width row. Translated
	 * separately rather than truncated, since the English forms are initials.
	 */
	getShortLabel?: () => string;
	getRange: ( ctx: DateContext ) => Required< DateRange >;
};

/**
 * Canonical preset definitions with labels and range calculators.
 * Labels are defined once here and reused by all consumers.
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
			_x( 'Last 24H', 'short date range preset', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { now } ) => ( {
			from: subHours( now, 24 ),
			to: now,
		} ),
	},
	{
		id: PRESET_LAST_7_DAYS,
		getLabel: () => __( 'Last 7 days', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "Last 7 days". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
			_x( '7D', 'short date range preset', 'jetpack-premium-analytics-pkg' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 7 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_30_DAYS,
		getLabel: () => __( 'Last 30 days', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "Last 30 days". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
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
		getShortLabel: () =>
			/* translators: abbreviation for "Last 12 months". Shown in a segmented control too narrow for the full label, so keep it as short as the language allows. */
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
	return id === PRESET_ALL_TIME
		? __( 'All time', 'jetpack-premium-analytics-pkg' )
		: String( getPresetYear( id ) );
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
 * Represents a date range preset option.
 * Preset ranges always have both `from` and `to` defined.
 */
export type DateRangePreset< TId extends ComputablePresetId = SelectablePresetId > = {
	id: TId;
	label: string;
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
 * Range covering every year the surface lists, from the start of the oldest one
 * through the end of today.
 *
 * @param startYear - The oldest year listed.
 * @param ctx       - The date context.
 * @return The all-time range.
 */
function computeAllTimeRange( startYear: number, ctx: DateContext ): Required< DateRange > {
	return {
		from: createTZDateFromParts( [ startYear, 0, 1 ], ctx.timeZone ),
		to: ctx.endOfToday,
	};
}

/**
 * Get the default date range presets with computed ranges.
 *
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @return The default date range presets.
 */
export function getDefaultDateRangePresets( timeZone: string ): DateRangePreset[] {
	const ctx = buildDateContext( timeZone );

	return PRESET_DEFINITIONS.map( ( { id, getLabel, getShortLabel, getRange } ) => ( {
		id,
		label: getLabel(),
		shortLabel: getShortLabel?.(),
		range: getRange( ctx ),
	} ) );
}

/**
 * Rolling-window presets for the date-range filter surface pills.
 *
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @return Quick surface presets in display order.
 */
export function getQuickSurfacePresets( timeZone: string ): DateRangePreset[] {
	const presetsById = new Map(
		getDefaultDateRangePresets( timeZone ).map( preset => [ preset.id, preset ] )
	);

	return QUICK_SURFACE_PRESETS.map( id => presetsById.get( id ) ).filter(
		( preset ): preset is DateRangePreset => preset !== undefined
	);
}

/**
 * Options shared by the year surface and its range calculations.
 */
export type YearSurfaceOptions = {
	/**
	 * Oldest year to cover. Doubles as the start of the all-time range, so both
	 * stay in step with what the surface shows. Defaults to
	 * `DEFAULT_YEAR_SURFACE_COUNT` years back.
	 */
	startYear?: number;
};

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
 * Compute the absolute date range (as Date objects) for a given
 * preset ID in the specified timezone.
 *
 * @param presetId - A valid computable preset identifier.
 * @param timeZone - IANA timezone string.
 * @param options  - Year surface options; only read for the all-time preset,
 *                 whose start is a property of the surface, not of the ID.
 * @return The computed { from, to } Date range, or undefined
 *         if the preset is not recognized.
 */
export function computePrimaryRange(
	presetId: ComputablePresetId,
	timeZone: string,
	options: YearSurfaceOptions = {}
): Required< DateRange > | undefined {
	const ctx = buildDateContext( timeZone );

	if ( presetId === PRESET_ALL_TIME ) {
		return computeAllTimeRange( resolveStartYear( options.startYear, ctx ), ctx );
	}

	const year = getPresetYear( presetId );
	if ( year !== null ) {
		return computeYearRange( year, ctx );
	}

	return PRESET_DEFINITIONS.find( p => p.id === presetId )?.getRange( ctx );
}
