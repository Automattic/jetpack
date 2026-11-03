/**
 * Internal dependencies
 */
import { computePrimaryRange } from './presets/primary';
import {
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_MONTH,
	PRESET_LAST_YEAR,
	PRESET_MONTH_TO_DATE,
	PRESET_YEAR_TO_DATE,
	SELECTABLE_PRESETS,
	type PrimaryPresetId,
	type SelectablePresetId,
} from './presets/types';
import type { DateRangeSpanUnit } from './date-range-span';
import type { DateRange } from './get-comparison-range';

/** The presets measured in whole months or years rather than a day count. */
const CALENDAR_PRESETS: readonly PrimaryPresetId[] = [
	PRESET_MONTH_TO_DATE,
	PRESET_LAST_MONTH,
	PRESET_YEAR_TO_DATE,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
];

// In January the year to date is also the month to date; a year step names it as the year.
const YEAR_PRESETS: readonly PrimaryPresetId[] = [ PRESET_YEAR_TO_DATE, PRESET_LAST_YEAR ];

/**
 * The presets a landing is tried against first, for the unit the step moved in.
 *
 * @param steppedBy - The unit the step moved in.
 * @return The presets to try first, in order.
 */
function leadingPresets( steppedBy?: DateRangeSpanUnit ): readonly PrimaryPresetId[] {
	switch ( steppedBy ) {
		case 'year':
			return [ ...YEAR_PRESETS, ...CALENDAR_PRESETS ];
		case 'month':
			return CALENDAR_PRESETS;
		default:
			return [];
	}
}

/**
 * Context the window was reached in.
 */
export type FindPresetOptions = {
	/**
	 * The unit the window was stepped by. Stepped by months or years, a window
	 * two presets cover reads as the calendar one: the month to date, not
	 * "Last 30 days", so the next step keeps moving by months.
	 */
	steppedBy?: DateRangeSpanUnit;
	/** Presets the plan locks, which the window is never named as. */
	exclude?: readonly PrimaryPresetId[];
};

/**
 * The selectable preset whose range is exactly this window today, if any, so a
 * window stepped back onto "Last 7 days" reads as the preset again.
 *
 * @param range    - The window to name.
 * @param timeZone - The site's reporting zone the presets are computed in.
 * @param options  - Context the window was reached in.
 * @return The preset id, or `undefined` when no preset covers exactly this window.
 */
export function findSelectablePresetForRange(
	range: DateRange,
	timeZone: string,
	options: FindPresetOptions = {}
): SelectablePresetId | undefined {
	const { from, to } = range;

	if ( ! from || ! to ) {
		return undefined;
	}

	const { steppedBy, exclude = [] } = options;
	const selectable: readonly PrimaryPresetId[] = SELECTABLE_PRESETS;
	const leading = leadingPresets( steppedBy ).filter( ( id ): id is SelectablePresetId =>
		selectable.includes( id )
	);
	const candidates = [ ...new Set( [ ...leading, ...SELECTABLE_PRESETS ] ) ];

	return candidates.find( id => {
		if ( exclude.includes( id ) ) {
			return false;
		}

		const preset = computePrimaryRange( id, timeZone );

		return preset?.from.getTime() === from.getTime() && preset.to.getTime() === to.getTime();
	} );
}
