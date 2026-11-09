/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { computePrimaryRange } from './presets/primary';
import {
	PRESET_ALL_TIME,
	PRESET_CUSTOM,
	isSelectablePreset,
	type PrimaryPresetId,
} from './presets/types';
import {
	endOfStepHorizon,
	getStepSpan,
	measureStepId,
	parseDateStepId,
	shiftStep,
	type DateStepId,
	type StepDirection,
} from './step-date-range';
import type { DateRange } from './get-comparison-range';

/**
 * What a step is decided against.
 */
export type DateStepContext = {
	/** The preset the applied window is, which sets how it steps. */
	presetId?: PrimaryPresetId;

	/** The `step` the applied window was reached by, as the URL carries it. */
	step?: unknown;

	/** The site's reporting zone, which the presets are computed in. */
	timeZone: string;

	/** The current instant. */
	now: Date;

	/** The first instant the plan lets the site read; a step before it is refused. */
	earliestDate?: Date;
};

/**
 * The window a step lands on, as the date filters apply it.
 */
export type DateStep = {
	range: Required< DateRange >;

	/** The preset the step set out from, when it lands back on that preset's window today; else `custom`. */
	presetId: PrimaryPresetId;

	/** The step the landing is to carry, so the next step moves the same way. */
	step: DateStepId;
};

/**
 * Decides a step in full: whether the window can move that way, where it lands
 * and what the landing is called. The arrows that offer a step and the filters
 * that apply it read the same answer, so they cannot disagree.
 *
 * A window steps by one unit, decided once: a preset's own (7 days, a month, a
 * year), or the shape a hand-picked window has on its first step. The landing
 * carries that unit as its `step`, so every later step moves the same way
 * whatever shape it lands on, and the reverse step always undoes it.
 *
 * Backward, the step has to start on or after the plan's earliest date.
 * Forward, the next window has to have begun; its end is cut at the end of
 * today (of the running hour, for a window stepping by hours), and the step
 * away from it rebuilds the whole unit. The landing reads as a preset only
 * when it is the window of the preset the reader set out from.
 *
 * @param range     - The applied window. A preset steps from the window it names today.
 * @param direction - Which way to move it.
 * @param context   - What the step is decided against.
 * @return The step, or `undefined` when the window cannot move that way.
 */
export function planDateStep(
	range: DateRange,
	direction: StepDirection,
	context: DateStepContext
): DateStep | undefined {
	const { presetId, timeZone, earliestDate } = context;

	if ( ! range.from || ! range.to || presetId === PRESET_ALL_TIME ) {
		return undefined;
	}

	// A preset is the window it names today, whatever dates the URL kept: a bookmark or a
	// tab left open shows today's window, so a step sets out from there too.
	const applied =
		( isSelectablePreset( presetId ) &&
			computePrimaryRange( presetId, timeZone, { now: context.now } ) ) ||
		range;

	// Everything below cuts boundaries on the site's calendar, whatever clock the ends arrived on.
	const zoned = {
		from: new TZDate( applied.from.getTime(), timeZone ),
		to: new TZDate( applied.to.getTime(), timeZone ),
	};
	const step = isSelectablePreset( presetId )
		? presetId
		: ( parseDateStepId( context.step ) ?? measureStepId( zoned ) );

	if ( ! step ) {
		return undefined;
	}

	const span = getStepSpan( step );
	const now = new TZDate( context.now.getTime(), timeZone );
	const stepped = shiftStep( zoned, span, direction );
	const reachable =
		direction === 'previous'
			? ! earliestDate || stepped.from.getTime() >= earliestDate.getTime()
			: stepped.from.getTime() <= now.getTime();

	if ( ! reachable ) {
		return undefined;
	}

	const horizon = endOfStepHorizon( now, span.unit );
	const landing = {
		from: stepped.from,
		to: stepped.to.getTime() > horizon.getTime() ? horizon : stepped.to,
	};
	const origin = isSelectablePreset( step ) ? step : undefined;
	const home = origin && computePrimaryRange( origin, timeZone, { now: context.now } );
	const isHome =
		home?.from.getTime() === landing.from.getTime() && home.to.getTime() === landing.to.getTime();

	return { range: landing, presetId: origin && isHome ? origin : PRESET_CUSTOM, step };
}
