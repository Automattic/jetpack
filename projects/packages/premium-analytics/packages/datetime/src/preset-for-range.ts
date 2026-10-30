/**
 * Internal dependencies
 */
import { computePrimaryRange } from './presets/primary';
import { SELECTABLE_PRESETS, type SelectablePresetId } from './presets/types';
import type { DateRange } from './get-comparison-range';

/**
 * The selectable preset whose range is exactly this window today, if any, so a
 * window stepped back onto "Last 7 days" reads as the preset again.
 *
 * @param range    - The window to name.
 * @param timeZone - The site's reporting zone the presets are computed in.
 * @return The preset id, or `undefined` when no preset covers exactly this window.
 */
export function findSelectablePresetForRange(
	range: DateRange,
	timeZone: string
): SelectablePresetId | undefined {
	const { from, to } = range;

	if ( ! from || ! to ) {
		return undefined;
	}

	return SELECTABLE_PRESETS.find( id => {
		const preset = computePrimaryRange( id, timeZone );

		return preset?.from.getTime() === from.getTime() && preset.to.getTime() === to.getTime();
	} );
}
