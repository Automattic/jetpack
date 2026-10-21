/**
 * External dependencies
 */
import { useRaisePeriodChange, type LockableInterval } from '@jetpack-premium-analytics/data';
import { PRESET_CUSTOM, type DateRange } from '@jetpack-premium-analytics/datetime';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import {
	buildRangePatch,
	type ReportQuerySearchParams,
} from '../use-report-date-filters/build-range-patch';
import { useStagedSearch } from '../use-staged-search';

type ExactRangeSearch = ReportQuerySearchParams & { section?: string };

export type CommitExactRange = (
	surface: string,
	range: Required< DateRange >,
	options?: { opensSection?: boolean; lockedIntervals?: readonly LockableInterval[] }
) => void;

/**
 * Commit a range a widget computed as a custom period, in one history entry so
 * Back returns to where the reader left, and signal the change to `surface`.
 *
 * @return The commit, taking the surface, the range, and whether to open the surface as a dashboard section.
 */
export function useCommitExactRange(): CommitExactRange {
	const { effective, stage, commit } = useStagedSearch< ExactRangeSearch, string >( {} );
	const raisePeriodChange = useRaisePeriodChange();

	return useCallback(
		( surface, range, { opensSection = false, lockedIntervals } = {} ) => {
			const patch = buildRangePatch( {
				nextRange: range,
				nextPresetId: PRESET_CUSTOM,
				exactRange: true,
				effective,
				lockedIntervals,
			} );

			raisePeriodChange( surface, range );
			stage( opensSection ? { ...patch, section: surface } : patch );
			commit( { replace: false } );
		},
		[ effective, stage, commit, raisePeriodChange ]
	);
}
