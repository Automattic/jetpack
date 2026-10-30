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
import type { DateRange } from './get-comparison-range';

/** The presets measured in whole months or years rather than a day count. */
const CALENDAR_PRESETS: readonly PrimaryPresetId[] = [
	PRESET_MONTH_TO_DATE,
	PRESET_LAST_MONTH,
	PRESET_YEAR_TO_DATE,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
];

/**
 * Context the window was reached in.
 */
export type FindPresetOptions = {
	/**
	 * The preset the window was stepped from. From a calendar preset, a window
	 * two presets cover reads as the calendar one: the month to date, not
	 * "Last 30 days", so the next step keeps moving by months.
	 */
	presetId?: PrimaryPresetId;
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

	const { presetId, exclude = [] } = options;
	const isCalendar = ( id: PrimaryPresetId ) => CALENDAR_PRESETS.includes( id );
	const candidates =
		presetId && isCalendar( presetId )
			? [
					...SELECTABLE_PRESETS.filter( isCalendar ),
					...SELECTABLE_PRESETS.filter( id => ! isCalendar( id ) ),
				]
			: SELECTABLE_PRESETS;

	return candidates.find( id => {
		if ( exclude.includes( id ) ) {
			return false;
		}

		const preset = computePrimaryRange( id, timeZone );

		return preset?.from.getTime() === from.getTime() && preset.to.getTime() === to.getTime();
	} );
}
