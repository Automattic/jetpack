/**
 * External dependencies
 */
import {
	getAllowedIntervalsForPreset,
	hasComparisonEnabled,
	resolveIntervalForRange,
} from '@jetpack-premium-analytics/data';
import {
	drillDateRange,
	PRESET_CUSTOM,
	siteTimeZone,
	stepDateRange,
	toLocalTZ,
} from '@jetpack-premium-analytics/datetime';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { decodeDateSearchParam, encodeDateToSearchParam } from '../../search/date-range';
import { hasPrimaryDateDraft } from '../../search/report-params';
import { useStagedSearch } from '../use-staged-search';
import { buildRangePatch, type ReportQuerySearchParams } from './build-range-patch';
import type {
	ComparisonPresetId,
	DateRange,
	IntervalType,
	PrimaryPresetId,
	StepDirection,
} from '@jetpack-premium-analytics/datetime';

type PickerRange = { from: Date | undefined; to: Date | undefined };

/**
 * The values and callbacks that drive `DateFiltersPanel`.
 */
export type ReportDateFilters = {
	presetId?: PrimaryPresetId;
	range: PickerRange;
	appliedPresetId?: PrimaryPresetId;
	appliedRange: PickerRange;
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
	 * The applied chart interval, for surfaces describing what the widgets are
	 * currently drawing rather than what the picker is holding.
	 */
	appliedInterval: IntervalType;

	/**
	 * The intervals the range being edited allows, finest first — what the
	 * control lists.
	 */
	intervalOptions: IntervalType[];

	onChange: ( range?: DateRange, presetId?: PrimaryPresetId ) => void;
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;
	onIntervalChange: ( interval: IntervalType ) => void;

	/**
	 * Step the applied window backward or forward by its own length.
	 */
	onStep: ( direction: StepDirection ) => void;

	/**
	 * Open the chart bucket containing a date, narrowing to the next finer
	 * interval. `interval` is the bucket size the chart drew; defaults to the
	 * applied interval.
	 */
	drillDown: ( date: Date, interval?: IntervalType ) => void;

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
 * `from`/`to` (e.g. a hand-edited or under-encoded deep link where the `+`
 * offset decoded to a space) must not become an invalid Date: the picker's
 * `formatToTimezoneNaiveString` throws on one and would white-screen the page,
 * and the trigger label would read "Invalid date".
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
 * Controller for the date-range and comparison filters, backed by the URL
 * search params on a given route.
 *
 * Edits are staged locally and committed atomically on Apply (or immediately
 * for comparison changes), so widgets re-fetch only on commit. The hook returns
 * everything `DateFiltersPanel` needs. Shared by every analytics page that
 * mounts the panel so the staged-search behavior stays identical across them.
 *
 * @param from - The route path the search params are bound to (e.g. `/`). Omit
 *             to bind to whichever route is matched, as a widget must: it
 *             renders on any page that hosts it.
 * @return Props for `DateFiltersPanel`.
 */
export function useReportDateFilters< TFrom extends string >( from?: TFrom ): ReportDateFilters {
	const { committed, effective, stage, commit, revert, isDirty } = useStagedSearch<
		ReportQuerySearchParams,
		TFrom
	>( { from } );

	const timeZone = siteTimeZone();

	const presetId = useMemo( () => effective.preset ?? undefined, [ effective.preset ] );
	const range = useMemo(
		() => toPickerRange( effective.from, effective.to, timeZone ),
		[ effective.from, effective.to, timeZone ]
	);

	const appliedPresetId = useMemo( () => committed.preset ?? undefined, [ committed.preset ] );
	const appliedRange = useMemo(
		() => toPickerRange( committed.from, committed.to, timeZone ),
		[ committed.from, committed.to, timeZone ]
	);

	const onChange = useCallback(
		( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
			const patch = buildRangePatch( { nextRange, nextPresetId, effective } );

			if ( patch ) {
				stage( patch );
			}
		},
		[ stage, effective ]
	);

	// Gated like the applied pair below: a link carrying `compare_preset` with no
	// window compares nothing, and must not paint the control active.
	const comparisonPresetId = useMemo(
		() => ( hasComparisonEnabled( effective ) ? effective.compare_preset ?? undefined : undefined ),
		[ effective ]
	);

	/*
	 * Applied, not staged: a comparison commits on its own but can ride
	 * uncommitted alongside a staged primary edit, so this can't read `effective`.
	 * Gated like the report params, so it never shows an unrequested comparison.
	 */
	const { appliedComparisonPresetId, appliedComparisonRange } = useMemo( () => {
		if ( ! hasComparisonEnabled( committed ) ) {
			return { appliedComparisonPresetId: undefined, appliedComparisonRange: undefined };
		}

		return {
			appliedComparisonPresetId: committed.compare_preset ?? undefined,
			// Read the params the widgets queried with so the header cannot name
			// a different window than the numbers came from.
			appliedComparisonRange: toPickerRange(
				committed.compare_from,
				committed.compare_to,
				timeZone
			),
		};
	}, [ committed, timeZone ] );

	const hasPrimaryDraft = hasPrimaryDateDraft( committed, effective );

	// Listed and checked against the range being edited — see
	// `getAllowedIntervalsForPreset` for why the draft and not the applied window.
	const intervalOptions = useMemo(
		() => getAllowedIntervalsForPreset( presetId, effective.from ?? '', effective.to ?? '' ),
		[ presetId, effective.from, effective.to ]
	);

	const interval = useMemo(
		() =>
			resolveIntervalForRange(
				presetId,
				effective.from ?? '',
				effective.to ?? '',
				effective.interval
			),
		[ presetId, effective.from, effective.to, effective.interval ]
	);

	// What the widgets are drawing, for the surfaces that describe them rather
	// than the picker — the chart the drill-down reads its buckets from.
	const appliedInterval = useMemo(
		() =>
			resolveIntervalForRange(
				appliedPresetId,
				committed.from ?? '',
				committed.to ?? '',
				committed.interval
			),
		[ appliedPresetId, committed.from, committed.to, committed.interval ]
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
			stage( { interval: nextInterval } );

			if ( ! hasPrimaryDraft ) {
				commit();
			}
		},
		[ stage, commit, hasPrimaryDraft ]
	);

	/*
	 * Commits and pushes a history entry so Back undoes the step. Steps the
	 * applied range, not the staged one — the arrows sit outside the picker,
	 * so stepping must not apply an open draft.
	 */
	const onStep = useCallback(
		( direction: StepDirection ) => {
			const stepped = stepDateRange( appliedRange, direction );

			if ( ! stepped ) {
				return;
			}

			const patch = buildRangePatch( {
				nextRange: stepped,
				nextPresetId: PRESET_CUSTOM,
				exactRange: true,
				effective,
			} );

			if ( patch ) {
				stage( patch );
				commit();
			}
		},
		[ appliedRange, commit, effective, stage ]
	);

	/*
	 * Commits and pushes a history entry, like `onStep`, so Back exits a
	 * drill-down. Reads the applied range/interval, not the staged one: the
	 * chart draws what's applied, so the click belongs to that window.
	 */
	const drillDown = useCallback(
		( date: Date, bucketInterval: IntervalType = appliedInterval ) => {
			/*
			 * Re-anchored to the site zone first: `drillDateRange` closes a bucket
			 * on the clock of the date passed in, and a plain instant would cut it
			 * on the browser's clock instead.
			 */
			const drilled = drillDateRange( toLocalTZ( date, timeZone ), bucketInterval, new Date() );

			if ( ! drilled?.from || ! drilled.to ) {
				return;
			}

			/*
			 * Kept inside the applied window: a bucket at either edge of the chart
			 * is usually a partial one, and opening it whole would widen the report
			 * past the range the user asked for.
			 */
			const clampedFrom =
				appliedRange.from && drilled.from < appliedRange.from ? appliedRange.from : drilled.from;
			const clampedTo =
				appliedRange.to && drilled.to > appliedRange.to ? appliedRange.to : drilled.to;

			if ( clampedFrom.getTime() >= clampedTo.getTime() ) {
				return;
			}

			const patch = buildRangePatch( {
				nextRange: { from: clampedFrom, to: clampedTo },
				nextPresetId: PRESET_CUSTOM,
				exactRange: true,
				effective,
			} );

			if ( patch ) {
				stage( patch );
				commit();
			}
		},
		[ appliedInterval, appliedRange, commit, effective, stage, timeZone ]
	);

	const onApply = useCallback( () => commit(), [ commit ] );
	const onCancel = useCallback( () => revert(), [ revert ] );

	/*
	 * `commit()` reads the staged buffer synchronously, so staging and committing
	 * in the same tick lands both as one navigation.
	 */
	const replaceRange = useCallback(
		( nextRange: DateRange, nextPresetId: PrimaryPresetId ) => {
			const patch = buildRangePatch( { nextRange, nextPresetId, effective } );

			if ( patch ) {
				stage( patch );
				commit( { replace: true } );
			}
		},
		[ stage, commit, effective ]
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
		appliedInterval,
		intervalOptions,
		onChange,
		onComparisonChange,
		onIntervalChange,
		onStep,
		drillDown,
		onApply,
		onCancel,
		canApply: isDirty,
		timeZone,
		replaceRange,
	};
}
