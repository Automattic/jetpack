/**
 * External dependencies
 */
import {
	getSiteTimezone,
	hasComparisonEnabled,
	localTZDate,
} from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { isValid } from 'date-fns';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { encodeDateToSearchParam } from '../../search/date-range';
import { useStagedSearch } from '../use-staged-search';
import { buildRangePatch, type ReportQuerySearchParams } from './build-range-patch';
import type {
	ComparisonPresetId,
	DateRange,
	PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';

/**
 * The values and callbacks that drive `DateFiltersPanel`.
 */
type PickerRange = { from: Date | undefined; to: Date | undefined };

export type ReportDateFilters = {
	presetId?: PrimaryPresetId;
	range: PickerRange;
	appliedPresetId?: PrimaryPresetId;
	appliedRange: PickerRange;
	comparisonPresetId?: ComparisonPresetId;
	appliedComparisonPresetId?: ComparisonPresetId;
	onChange: ( range?: DateRange, presetId?: PrimaryPresetId ) => void;
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;
	onApply: () => void;
	onCancel: () => void;
	canApply: boolean;
	timeZone: string;

	/**
	 * Stage a primary range change and commit it in the same tick, replacing the
	 * current history entry instead of pushing one.
	 *
	 * For range changes the page makes on the user's behalf rather than in
	 * response to a date edit — reconciling the preset with what the current
	 * screen can show, for instance. Those must not leave a Back step, or Back
	 * would return to the state that triggered the reconciliation and be
	 * corrected straight back out of.
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
	const parse = ( value?: string ) => {
		if ( ! value ) {
			return undefined;
		}
		const date = localTZDate( value, timeZone );
		return isValid( date ) ? date : undefined;
	};

	return {
		from: parse( from ),
		to: parse( to ),
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
 * @param from - The route path the search params are bound to (e.g. `/`).
 * @return Props for `DateFiltersPanel`.
 */
export function useReportDateFilters< TFrom extends string >( from: TFrom ): ReportDateFilters {
	const { committed, effective, stage, commit, revert, isDirty } = useStagedSearch<
		ReportQuerySearchParams,
		TFrom
	>( { from } );

	/*
	 * Read the site timezone reactively. A fully-specified deep link skips the
	 * seed's `ensureCoreSettingsReady()` await, so core `site` settings may not
	 * be loaded on first paint. Rebuild picker dates when the real timezone
	 * resolves instead of leaving them anchored to the browser fallback.
	 */
	const timeZone = useSelect( select => {
		void (
			select( coreStore ) as unknown as {
				getEntityRecord: ( kind: string, name: string ) => unknown;
			}
		 ).getEntityRecord( 'root', 'site' );
		return getSiteTimezone();
	}, [] );

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

	const comparisonPresetId = useMemo(
		() => effective.compare_preset ?? undefined,
		[ effective.compare_preset ]
	);

	/*
	 * The applied comparison, for surfaces that describe what the widgets are
	 * actually showing rather than what the picker is drafting. A comparison
	 * change normally commits on its own, but it rides along uncommitted when a
	 * primary edit is already staged, so this cannot read `effective`.
	 *
	 * Gated on the same predicate the report params run through, so a surface
	 * can never announce a comparison the widgets did not request.
	 */
	const appliedComparisonPresetId = useMemo(
		() => ( hasComparisonEnabled( committed ) ? committed.compare_preset ?? undefined : undefined ),
		[ committed ]
	);

	/**
	 * Comparison changes commit immediately — but only when the primary date
	 * isn't mid-edit. If a primary edit is staged but not yet applied, the
	 * comparison change rides along and commits together on Apply, so tweaking
	 * the comparison never commits an un-applied primary draft.
	 */
	const onComparisonChange = useCallback(
		( nextComparisonRange: DateRange | undefined, nextComparisonPresetId?: ComparisonPresetId ) => {
			stage( {
				compare_from: encodeDateToSearchParam( nextComparisonRange?.from ),
				compare_to: encodeDateToSearchParam( nextComparisonRange?.to ),
				compare_preset: nextComparisonPresetId ?? undefined,
				comp: nextComparisonRange ? '1' : undefined,
			} );

			const hasPrimaryDraft =
				effective.from !== committed.from ||
				effective.to !== committed.to ||
				effective.preset !== committed.preset;

			if ( ! hasPrimaryDraft ) {
				commit();
			}
		},
		[ stage, commit, effective, committed ]
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
		onChange,
		onComparisonChange,
		onApply,
		onCancel,
		canApply: isDirty,
		timeZone,
		replaceRange,
	};
}
