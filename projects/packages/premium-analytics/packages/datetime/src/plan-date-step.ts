/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { findSelectablePresetForRange } from './preset-for-range';
import { PRESET_CUSTOM, type PrimaryPresetId } from './presets/types';
import { endOfStepBucket, measureStep, shiftStep, type StepDirection } from './step-date-range';
import { clampRangeEndToToday } from './to-date-range';
import type { DateRangeSpan } from './date-range-span';
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

	/**
	 * The span the applied window was reached by, when it landed from a step.
	 * A step then moves by that again, so Previous undoes Next whatever shape
	 * the landing has: a 30-day window stepped back onto a whole June returns
	 * to its 30 days, not to the whole July.
	 */
	span?: DateRangeSpan;
};

/**
 * The window a step lands on, as the date filters apply it.
 */
export type DateStep = {
	range: Required< DateRange >;

	/** The preset whose window this is today, or `custom`. */
	presetId: PrimaryPresetId;

	/** The span the step moved by, for the reverse step to retrace. */
	span: DateRangeSpan;
};

/**
 * Decides a step in full: whether the window can move that way, where it lands
 * and what the landing is called. The arrows that offer a step and the filters
 * that apply it read the same answer, so they cannot disagree.
 *
 * Backward, the step has to start on or after the plan's earliest date.
 * Forward, the next window has to end within the bucket `now` sits in — the
 * running hour, day, month or year — so a live preset stays reachable from the
 * window behind it, and nothing steps past the latest one. A forward step
 * closes the unit the window was measured in, which can reach past today, so
 * the landing is pulled back to the end of today: stepping out of "12 months"
 * returns to its to-date window. The landing reads as a preset when it is
 * exactly that preset's window today, preferring a calendar preset when the
 * step moved by months, and never as a preset the plan locks. A window reached
 * by a step moves by that step's span again, so the reverse step undoes it.
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
	const { presetId, timeZone, earliestDate, lockedPresetIds, span } = context;

	if ( ! range.from || ! range.to ) {
		return undefined;
	}

	// Everything below cuts boundaries on the site's calendar, whatever clock the ends arrived on.
	const now = new TZDate( context.now.getTime(), timeZone );
	const measured = measureStep(
		{
			from: new TZDate( range.from.getTime(), timeZone ),
			to: new TZDate( range.to.getTime(), timeZone ),
		},
		{ presetId, now, span }
	);

	if ( ! measured ) {
		return undefined;
	}

	const stepped = shiftStep( measured, direction );
	const reachable =
		direction === 'previous'
			? ! earliestDate || stepped.from.getTime() >= earliestDate.getTime()
			: stepped.to.getTime() <= endOfStepBucket( now, stepped.span.unit ).getTime();

	if ( ! reachable ) {
		return undefined;
	}

	const landing = clampRangeEndToToday( { from: stepped.from, to: stepped.to }, now );

	return {
		range: landing,
		presetId:
			findSelectablePresetForRange( landing, timeZone, {
				steppedBy: stepped.span.unit,
				exclude: lockedPresetIds,
			} ) ?? PRESET_CUSTOM,
		span: stepped.span,
	};
}
