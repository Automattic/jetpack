/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
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
import { toLocalTZ } from '../tz';
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
	QUICK_SURFACE_PRESETS,
	type SelectablePresetId,
	type PrimaryPresetId,
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
};

/**
 * Preset definition with label getter and range calculator.
 */
type PresetDefinition = {
	id: SelectablePresetId;
	getLabel: () => string;
	getRange: ( ctx: DateContext ) => Required< DateRange >;
};

/**
 * Canonical preset definitions with labels and range calculators.
 * Labels are defined once here and reused by all consumers.
 */
export const PRESET_DEFINITIONS: ReadonlyArray< PresetDefinition > = [
	{
		id: PRESET_TODAY,
		getLabel: () => __( 'Today', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfToday } ) => ( {
			from: initOfToday,
			to: endOfToday,
		} ),
	},
	{
		id: PRESET_YESTERDAY,
		getLabel: () => __( 'Yesterday', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 1 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_24_HOURS,
		getLabel: () => __( 'Last 24 hours', 'jetpack-premium-analytics' ),
		getRange: ( { now } ) => ( {
			from: subHours( now, 24 ),
			to: now,
		} ),
	},
	{
		id: PRESET_LAST_7_DAYS,
		getLabel: () => __( 'Last 7 days', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 7 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_30_DAYS,
		getLabel: () => __( 'Last 30 days', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 30 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_90_DAYS,
		getLabel: () => __( 'Last 90 days', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 90 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_365_DAYS,
		getLabel: () => __( 'Last 365 days', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfYesterday } ) => ( {
			from: subDays( initOfToday, 365 ),
			to: endOfYesterday,
		} ),
	},
	{
		id: PRESET_LAST_MONTH,
		getLabel: () => __( 'Last month', 'jetpack-premium-analytics' ),
		getRange: ( { lastMonth, endOfLastMonth } ) => ( {
			from: startOfMonth( lastMonth ),
			to: endOfLastMonth,
		} ),
	},
	{
		id: PRESET_LAST_12_MONTHS,
		getLabel: () => __( 'Last 12 months', 'jetpack-premium-analytics' ),
		getRange: ( { initOfToday, endOfLastMonth } ) => ( {
			from: startOfMonth( subMonths( initOfToday, 12 ) ),
			to: endOfLastMonth,
		} ),
	},
	{
		id: PRESET_LAST_YEAR,
		getLabel: () => __( 'Last year', 'jetpack-premium-analytics' ),
		getRange: ( { lastYear } ) => ( {
			from: startOfYear( lastYear ),
			to: endOfYear( lastYear ),
		} ),
	},
];

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
	};
}

/**
 * Represents a date range preset option.
 * Preset ranges always have both `from` and `to` defined.
 */
export type DateRangePreset = {
	id: SelectablePresetId;
	label: string;
	range: Required< DateRange >;
};

/**
 * Get the default date range presets with computed ranges.
 *
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @return The default date range presets.
 */
export function getDefaultDateRangePresets( timeZone: string ): DateRangePreset[] {
	const ctx = buildDateContext( timeZone );

	return PRESET_DEFINITIONS.map( ( { id, getLabel, getRange } ) => ( {
		id,
		label: getLabel(),
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
 * Compute the absolute date range (as Date objects) for a given
 * selectable preset ID in the specified timezone.
 *
 * @param presetId - A valid selectable preset identifier.
 * @param timeZone - IANA timezone string.
 * @return The computed { from, to } Date range, or undefined
 *         if the preset is not recognized.
 */
export function computePrimaryRange(
	presetId: SelectablePresetId,
	timeZone: string
): Required< DateRange > | undefined {
	const def = PRESET_DEFINITIONS.find( p => p.id === presetId );
	if ( ! def ) {
		return undefined;
	}

	const ctx = buildDateContext( timeZone );
	return def.getRange( ctx );
}
