export { DateRangePresets } from './date-range-presets';

/**
 * Re-export types, constants, and guards from datetime
 * so existing consumers of this barrel continue to work.
 */
export {
	getDefaultDateRangePresets,
	getPresetLabel,
	isSelectablePreset,
	isPrimaryPreset,
	// Preset constants
	PRESET_TODAY,
	PRESET_YESTERDAY,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_MONTH,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
	PRESET_CUSTOM,
} from '@jetpack-premium-analytics/datetime';

export type {
	PrimaryPresetId,
	SelectablePresetId,
	DateRangePreset,
} from '@jetpack-premium-analytics/datetime';
