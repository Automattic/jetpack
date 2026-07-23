/**
 * External dependencies
 */
import { getSiteTimezone, localTZDate } from '@jetpack-premium-analytics/data';
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
 * The values and callbacks that drive `DateFiltersPanel`, minus the
 * `containerElement` ref which the consuming page owns.
 */
type PickerRange = { from: Date | undefined; to: Date | undefined };

export type ReportDateFilters = {
	presetId?: PrimaryPresetId;
	range: PickerRange;
	appliedPresetId?: PrimaryPresetId;
	appliedRange: PickerRange;
	comparisonPresetId?: ComparisonPresetId;
	onChange: ( range?: DateRange, presetId?: PrimaryPresetId ) => void;
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;
	onApply: () => void;
	onCancel: () => void;
	canApply: boolean;
	timeZone: string;
};

/**
 * Parse search-param dates into a picker range, dropping unparseable values to
 * `undefined`. The picker reads these straight from the URL, so a malformed
 * `from`/`to` (e.g. a hand-edited or under-encoded deep link where the `+`
 * offset decoded to a space) must not become an invalid Date — `formatDate`
 * throws "Invalid time value" on one and would white-screen the page.
 *
 * @param from - The `from` search param.
 * @param to   - The `to` search param.
 * @return The parsed range, with invalid endpoints as `undefined`.
 */
function toPickerRange( from?: string, to?: string ) {
	const parse = ( value?: string ) => {
		if ( ! value ) {
			return undefined;
		}
		const date = localTZDate( value );
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
 * everything `DateFiltersPanel` needs except the responsive-measurement
 * `containerElement`, which the page owns. Shared by every analytics page that
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

	const presetId = useMemo( () => effective.preset ?? undefined, [ effective.preset ] );
	const range = useMemo(
		() => toPickerRange( effective.from, effective.to ),
		[ effective.from, effective.to ]
	);

	const appliedPresetId = useMemo( () => committed.preset ?? undefined, [ committed.preset ] );
	const appliedRange = useMemo(
		() => toPickerRange( committed.from, committed.to ),
		[ committed.from, committed.to ]
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
	 * Read the site timezone reactively. A fully-specified deep link skips the
	 * seed's `ensureCoreSettingsReady()` await, so core `site` settings may not
	 * be loaded on first paint; subscribing here re-renders with the real site
	 * timezone once they resolve, instead of sticking with the browser fallback.
	 */
	const timeZone = useSelect( select => {
		void (
			select( coreStore ) as unknown as {
				getEntityRecord: ( kind: string, name: string ) => unknown;
			}
		 ).getEntityRecord( 'root', 'site' );
		return getSiteTimezone();
	}, [] );

	return {
		presetId,
		range,
		appliedPresetId,
		appliedRange,
		comparisonPresetId,
		onChange,
		onComparisonChange,
		onApply,
		onCancel,
		canApply: isDirty,
		timeZone,
	};
}
