/**
 * External dependencies
 */
import { useRaisePeriodChange } from '@jetpack-premium-analytics/data';
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
	section?: string
) => void;

/**
 * Commit a range a widget computed as a custom period, in one history entry so
 * Back returns to where the reader left, and signal the change to `surface`.
 *
 * @return The commit, taking the surface that shows the range, the range, and the section to open it on.
 */
export function useCommitExactRange(): CommitExactRange {
	const { effective, stage, commit } = useStagedSearch< ExactRangeSearch, string >( {} );
	const raisePeriodChange = useRaisePeriodChange();

	return useCallback(
		( surface, range, section ) => {
			const patch = buildRangePatch( {
				nextRange: range,
				nextPresetId: PRESET_CUSTOM,
				exactRange: true,
				effective,
			} );

			raisePeriodChange( surface, range );
			stage( section ? { ...patch, section } : patch );
			commit( { replace: false } );
		},
		[ effective, stage, commit, raisePeriodChange ]
	);
}
