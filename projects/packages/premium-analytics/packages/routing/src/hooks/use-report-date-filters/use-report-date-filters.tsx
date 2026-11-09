/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	intervalMenuOptions,
	resolveIntervalForRange,
	useReportScope,
	useScopeLockedIntervals,
	type DateLimits,
	type LockableInterval,
} from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	PRESET_CUSTOM,
	computePrimaryRange,
	isSelectablePreset,
	isYearPresetId,
	planDateStep,
	reportingTimeZone,
	toComparisonPresetId,
} from '@jetpack-premium-analytics/datetime';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { deriveComparisonRange } from '../../search/comparison';
import { decodeDateSearchParam, encodeDateToSearchParam } from '../../search/date-range';
import { hasPrimaryDateDraft } from '../../search/report-params';
import { useStagedSearch } from '../use-staged-search';
import { buildRangePatch, type ReportQuerySearchParams } from './build-range-patch';
import type {
	ComparisonPresetId,
	ComputablePresetId,
	DateRange,
	DateStep,
	IntervalType,
	PrimaryPresetId,
	StepDirection,
} from '@jetpack-premium-analytics/datetime';

/**
 * The values and callbacks that drive `DateFiltersPanel`.
 */
export type ReportDateFilters = {
	presetId?: PrimaryPresetId;
	range: DateRange;
	appliedPresetId?: PrimaryPresetId;
	appliedRange: DateRange;
	comparisonPresetId?: ComparisonPresetId;
	appliedComparisonPresetId?: ComparisonPresetId;

	/**
	 * The applied comparison window, when comparison is enabled.
	 */
	appliedComparisonRange?: DateRange;

	/**
	 * The chart interval the control shows as checked.
	 */
	interval: IntervalType;

	/**
	 * The intervals the range being edited allows, finest first — what the
	 * control lists.
	 */
	intervalOptions: IntervalType[];

	/** The intervals the range would allow but the plan locks, for the control to show as locked. */
	lockedIntervalOptions: LockableInterval[];

	/**
	 * Stage a primary range edit. `exactRange` stores the ends as given rather
	 * than widening `to` to the end of its day: for a range a card computed,
	 * not one the reader picked from the calendar.
	 */
	onChange: (
		range?: DateRange,
		presetId?: PrimaryPresetId,
		options?: { exactRange?: boolean }
	) => void;
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;
	onIntervalChange: ( interval: IntervalType ) => void;

	/**
	 * The arrows' step and whether each has somewhere to go: an earlier window
	 * the plan lets the site read, a later one that has begun. `onStep` commits
	 * the step and returns what it committed, so a caller can track it as
	 * applied: the preset the step set out from when it lands back on it, or
	 * `custom`, and the interval kept.
	 */
	stepping: {
		canStepBackward: boolean;
		canStepForward: boolean;
		onStep: ( direction: StepDirection ) => ( DateStep & { interval: IntervalType } ) | undefined;
	};

	onApply: () => void;
	onCancel: () => void;
	canApply: boolean;
	timeZone: string;

	/**
	 * Stage and commit a range change without pushing a history entry — for
	 * programmatic reconciliation (not a direct date edit), so Back can't loop
	 * into the state that triggered the reconciliation.
	 */
	replaceRange: ( range: DateRange, presetId: PrimaryPresetId ) => void;
};

/**
 * Parse search-param dates into a picker range, dropping unparseable values to
 * `undefined`. The picker reads these straight from the URL, so a malformed
 * `from`/`to` (e.g. a hand-edited deep link with an offset that does not exist)
 * must not become an invalid Date: the picker's `formatToTimezoneNaiveString`
 * throws on one and would white-screen the page, and the trigger label would
 * read "Invalid date".
 *
 * @param from     - The `from` search param.
 * @param to       - The `to` search param.
 * @param timeZone - The timezone used by the picker.
 * @return The parsed range, with invalid endpoints as `undefined`.
 */
function toPickerRange( from: string | undefined, to: string | undefined, timeZone: string ) {
	return {
		from: decodeDateSearchParam( from, timeZone ),
		to: decodeDateSearchParam( to, timeZone ),
	};
}

/**
 * Whether the URL names a window to measure on the site's clock today rather than to read from
 * its dates: a selectable or year preset, or all time next to the dates the section wrote. The one
 * test behind both resolvers below, so the primary and its comparison can't drift apart.
 *
 * @param presetId - The preset the URL carries, if any.
 * @param from     - The `from` search param.
 * @param to       - The `to` search param.
 * @return Whether the preset's window is measured today.
 */
function namesTodaysWindow(
	presetId: string | undefined,
	from: string | undefined,
	to: string | undefined
): presetId is ComputablePresetId {
	return (
		isSelectablePreset( presetId ) ||
		isYearPresetId( presetId ) ||
		( presetId === PRESET_ALL_TIME && !! from && !! to )
	);
}

/**
 * The window a preset or a pair of URL dates names: a preset is the window it names today, as
 * `normalizeReportParams` reads it for the widgets, so a stale bookmark's controls match its numbers.
 * All time keeps the URL's start and ends today; a hand-picked range is its dates.
 *
 * @param presetId - The preset the URL carries, if any.
 * @param from     - The `from` search param.
 * @param to       - The `to` search param.
 * @param timeZone - The site's reporting zone.
 * @return The window.
 */
function resolveRange(
	presetId: string | undefined,
	from: string | undefined,
	to: string | undefined,
	timeZone: string
): DateRange {
	const computed = namesTodaysWindow( presetId, from, to )
		? computePrimaryRange( presetId, timeZone )
		: undefined;
	if ( ! computed ) {
		return toPickerRange( from, to, timeZone );
	}
	return presetId === PRESET_ALL_TIME
		? { from: decodeDateSearchParam( from, timeZone ), to: computed.to }
		: computed;
}

/**
 * The comparison the URL names, read as `normalizeReportParams` reads it for the widgets: a preset
 * window's comparison preset is measured again from the window it names today, a hand-picked
 * window's dates are kept. Gated on the window, so `compare_preset` alone compares nothing.
 *
 * @param params   - The search params, staged or committed.
 * @param primary  - The primary window those params name.
 * @param timeZone - The site's reporting zone.
 * @return The comparison preset and window, or neither when comparison is off.
 */
function resolveComparison(
	params: ReportQuerySearchParams,
	primary: DateRange,
	timeZone: string
): { presetId?: ComparisonPresetId; range?: DateRange } {
	if ( ! hasComparisonEnabled( params ) ) {
		return {};
	}

	const isPresetWindow = namesTodaysWindow( params.preset, params.from, params.to );
	const from = encodeDateToSearchParam( primary.from );
	const to = encodeDateToSearchParam( primary.to );
	const measured =
		isPresetWindow && toComparisonPresetId( params.compare_preset ) && from && to
			? deriveComparisonRange( { ...params, from, to } )
			: undefined;

	return {
		presetId: measured?.compare_preset ?? params.compare_preset ?? undefined,
		range: toPickerRange(
			measured?.compare_from ?? params.compare_from,
			measured?.compare_to ?? params.compare_to,
			timeZone
		),
	};
}

/**
 * Controller for the date-range and comparison filters, backed by the URL
 * search params on a given route.
 *
 * Edits are staged locally and committed atomically on Apply (or immediately
 * for comparison changes), so widgets re-fetch only on commit. The hook returns
 * everything `DateFiltersPanel` needs. Shared by every analytics page that
 * mounts the panel so the staged-search behavior stays identical across them.
 *
 * @param from                     - The route path the search params are bound to (e.g. `/`).
 * @param filterOptions            - Hook options.
 * @param filterOptions.dateLimits - The dates, presets and intervals the plan locks; defaults to the report scope's.
 * @return Props for `DateFiltersPanel`.
 */
export function useReportDateFilters< TFrom extends string >(
	from: TFrom,
	filterOptions: { dateLimits?: DateLimits } = {}
): ReportDateFilters {
	const { committed, effective, stage, commit, revert, isDirty } = useStagedSearch<
		ReportQuerySearchParams,
		TFrom
	>( { from } );

	// Report pages render inside their scope; the dashboard and detail stages sit above it and pass limits in.
	const scopedLocks = useScopeLockedIntervals();
	const lockedIntervals = filterOptions.dateLimits?.lockedIntervals ?? scopedLocks;
	const scopedDateLimits = useReportScope().dateLimits;
	const { earliestDate } = filterOptions.dateLimits ?? scopedDateLimits ?? {};

	const timeZone = reportingTimeZone();

	const presetId = useMemo( () => effective.preset ?? undefined, [ effective.preset ] );
	const range = useMemo(
		() => resolveRange( presetId, effective.from, effective.to, timeZone ),
		[ presetId, effective.from, effective.to, timeZone ]
	);

	const appliedPresetId = useMemo( () => committed.preset ?? undefined, [ committed.preset ] );
	const appliedRange = useMemo(
		() => resolveRange( appliedPresetId, committed.from, committed.to, timeZone ),
		[ appliedPresetId, committed.from, committed.to, timeZone ]
	);

	const onChange = useCallback(
		(
			nextRange?: DateRange,
			nextPresetId?: PrimaryPresetId,
			options?: { exactRange?: boolean }
		) => {
			const patch = buildRangePatch( {
				nextRange,
				nextPresetId,
				exactRange: options?.exactRange,
				resetIntervalOnPresetChange: true,
				effective,
				lockedIntervals,
			} );

			if ( patch ) {
				stage( patch );
			}
		},
		[ stage, effective, lockedIntervals ]
	);

	// Read against the window being edited, so the control names what applying it would compare.
	const comparisonPresetId = useMemo(
		() => resolveComparison( effective, range, timeZone ).presetId,
		[ effective, range, timeZone ]
	);

	/*
	 * Applied, not staged: a comparison commits on its own but can ride
	 * uncommitted alongside a staged primary edit, so this can't read `effective`.
	 */
	const { presetId: appliedComparisonPresetId, range: appliedComparisonRange } = useMemo(
		() => resolveComparison( committed, appliedRange, timeZone ),
		[ committed, appliedRange, timeZone ]
	);

	const hasPrimaryDraft = hasPrimaryDateDraft( committed, effective );

	// Listed and checked against the range being edited — see
	// `getAllowedIntervalsForPreset` for why the draft and not the applied window.
	const { options: intervalOptions, lockedOptions: lockedIntervalOptions } = useMemo(
		() =>
			intervalMenuOptions(
				{ preset: presetId, from: effective.from, to: effective.to },
				lockedIntervals
			),
		[ presetId, effective.from, effective.to, lockedIntervals ]
	);

	const interval = useMemo(
		() =>
			resolveIntervalForRange(
				presetId,
				effective.from ?? '',
				effective.to ?? '',
				effective.interval,
				lockedIntervals
			),
		[ presetId, effective.from, effective.to, effective.interval, lockedIntervals ]
	);

	/**
	 * Comparison changes commit immediately, unless a primary edit is staged —
	 * then it rides along and commits with it on Apply, so a comparison tweak
	 * never commits an un-applied primary draft.
	 */
	const onComparisonChange = useCallback(
		( nextComparisonRange: DateRange | undefined, nextComparisonPresetId?: ComparisonPresetId ) => {
			stage( {
				compare_from: encodeDateToSearchParam( nextComparisonRange?.from ),
				compare_to: encodeDateToSearchParam( nextComparisonRange?.to ),
				compare_preset: nextComparisonPresetId ?? undefined,
				comp: nextComparisonRange ? '1' : undefined,
			} );

			if ( ! hasPrimaryDraft ) {
				commit();
			}
		},
		[ stage, commit, hasPrimaryDraft ]
	);

	/**
	 * The interval applies on click, the way the preset pills do. With a primary
	 * edit staged it rides along and commits with it on Apply.
	 */
	const onIntervalChange = useCallback(
		( nextInterval: IntervalType ) => {
			// Re-picking the shown bucket would push an identical history entry.
			if ( nextInterval === interval ) {
				return;
			}

			stage( { interval: nextInterval } );

			if ( ! hasPrimaryDraft ) {
				commit();
			}
		},
		[ interval, stage, commit, hasPrimaryDraft ]
	);

	/*
	 * One decision for the arrows and the step: the plan function says whether
	 * the window moves, where it lands and what the landing is called. The clock
	 * is read on each render, not memoised, so a tab left open past midnight
	 * offers the new day as soon as anything re-renders.
	 */
	const stepContext = useMemo(
		() => ( { presetId: appliedPresetId, step: committed.step, timeZone, earliestDate } ),
		[ appliedPresetId, committed.step, timeZone, earliestDate ]
	);
	const now = new Date();
	const canStepBackward =
		planDateStep( appliedRange, 'previous', { ...stepContext, now } ) !== undefined;
	const canStepForward =
		planDateStep( appliedRange, 'next', { ...stepContext, now } ) !== undefined;

	/*
	 * Commits and pushes a history entry so Back undoes the step. Steps the
	 * applied range, not the staged one: the arrows sit outside the picker, so
	 * stepping must not apply an open draft. The interval carries unless the new
	 * range disallows it: a step turns the page, it does not pick a preset anew.
	 * A landing off every preset carries its step in the URL, so the next step
	 * moves the same way after a reload too; back on its preset, the preset says.
	 */
	const onStep = useCallback(
		( direction: StepDirection ) => {
			const step = planDateStep( appliedRange, direction, { ...stepContext, now: new Date() } );
			const patch =
				step &&
				buildRangePatch( {
					nextRange: step.range,
					nextPresetId: step.presetId,
					exactRange: true,
					step: step.presetId === PRESET_CUSTOM ? step.step : undefined,
					effective,
					lockedIntervals,
				} );

			if ( ! step || ! patch ) {
				return undefined;
			}

			stage( patch );
			commit();

			return { ...step, interval: patch.interval ?? interval };
		},
		[ appliedRange, stepContext, commit, effective, interval, lockedIntervals, stage ]
	);

	const stepping = useMemo(
		() => ( { canStepBackward, canStepForward, onStep } ),
		[ canStepBackward, canStepForward, onStep ]
	);

	const onApply = useCallback( () => commit(), [ commit ] );
	const onCancel = useCallback( () => revert(), [ revert ] );

	/*
	 * `commit()` reads the staged buffer synchronously, so staging and committing
	 * in the same tick lands both as one navigation.
	 */
	const replaceRange = useCallback(
		( nextRange: DateRange, nextPresetId: PrimaryPresetId ) => {
			const patch = buildRangePatch( { nextRange, nextPresetId, effective, lockedIntervals } );

			if ( patch ) {
				stage( patch );
				commit( { replace: true } );
			}
		},
		[ stage, commit, effective, lockedIntervals ]
	);

	return {
		presetId,
		range,
		appliedPresetId,
		appliedRange,
		comparisonPresetId,
		appliedComparisonPresetId,
		appliedComparisonRange,
		interval,
		intervalOptions,
		lockedIntervalOptions,
		onChange,
		onComparisonChange,
		onIntervalChange,
		stepping,
		onApply,
		onCancel,
		canApply: isDirty,
		timeZone,
		replaceRange,
	};
}
