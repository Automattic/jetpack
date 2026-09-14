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

type SectionRangeSearch = ReportQuerySearchParams & { section?: string };

export type OpenSectionRange = ( section: string, range: Required< DateRange > ) => void;

/**
 * Open a dashboard section over an exact date range, stored as a custom
 * period, in one history entry so Back returns to where the reader left.
 *
 * @return The navigation, taking the section slug and the range to apply.
 */
export function useOpenSectionRange(): OpenSectionRange {
	const { effective, stage, commit } = useStagedSearch< SectionRangeSearch, string >( {} );
	const raisePeriodChange = useRaisePeriodChange();

	return useCallback(
		( section, range ) => {
			const patch = buildRangePatch( {
				nextRange: range,
				nextPresetId: PRESET_CUSTOM,
				exactRange: true,
				effective,
			} );

			// Raised first, so the section's date control knows the change is not the reader's.
			raisePeriodChange( section, range );
			stage( { ...patch, section } );
			commit( { replace: false } );
		},
		[ effective, stage, commit, raisePeriodChange ]
	);
}
