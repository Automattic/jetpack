/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { findSelectablePresetForRange } from './preset-for-range';
import { PRESET_CUSTOM, type PrimaryPresetId } from './presets/types';
import {
	canStepBackward,
	canStepForward,
	stepDateRange,
	type StepDirection,
} from './step-date-range';
import { clampRangeEndToToday } from './to-date-range';
import type { DateRange } from './get-comparison-range';

/**
 * What a step is decided against.
 */
export type DateStepContext = {
	/** The preset the applied window came from, which sets how it steps. */
	presetId?: PrimaryPresetId;

	/** The site's reporting zone, which the presets are computed in. */
	timeZone: string;

	/** The current instant. */
	now: Date;

	/** The first instant the plan lets the site read; a step before it is refused. */
	earliestDate?: Date;

	/** Presets the plan locks, which a stepped window is never named as. */
	lockedPresetIds?: readonly PrimaryPresetId[];
};

/**
 * The window a step lands on, as the date filters apply it.
 */
export type DateStep = {
	range: Required< DateRange >;

	/** The preset whose window this is today, or `custom`. */
	presetId: PrimaryPresetId;
};

/**
 * Decides a step in full: whether the window can move that way, where it lands
 * and what the landing is called. The arrows that offer a step and the filters
 * that apply it read the same answer, so they cannot disagree.
 *
 * A forward step closes the unit the window was measured in, which can reach
 * past today, so the landing is pulled back to the end of today: stepping out
 * of "12 months" returns to its to-date window. The landing reads as a preset
 * when it is exactly that preset's window today, preferring the unit it was
 * stepped in, and never as a preset the plan locks.
 *
 * @param range     - The applied window.
 * @param direction - Which way to move it.
 * @param context   - What the step is decided against.
 * @return The step, or `undefined` when the window cannot move that way.
 */
export function planDateStep(
	range: DateRange,
	direction: StepDirection,
	context: DateStepContext
): DateStep | undefined {
	const { presetId, timeZone, earliestDate, lockedPresetIds } = context;
	const now = new TZDate( context.now.getTime(), timeZone );
	const stepOptions = { presetId };
	const available =
		direction === 'previous'
			? canStepBackward( range, { ...stepOptions, earliestDate } )
			: canStepForward( range, now, stepOptions );
	const stepped = available ? stepDateRange( range, direction, stepOptions ) : undefined;

	if ( ! stepped ) {
		return undefined;
	}

	const landing = clampRangeEndToToday( stepped, now );

	return {
		range: landing,
		presetId:
			findSelectablePresetForRange( landing, timeZone, { presetId, exclude: lockedPresetIds } ) ??
			PRESET_CUSTOM,
	};
}
