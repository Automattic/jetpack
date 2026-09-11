/**
 * External dependencies
 */
import {
	PRESET_CUSTOM,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
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

export type OpenSectionRange = (
	section: string,
	range: Required< DateRange >,
	presetId?: PrimaryPresetId
) => void;

/**
 * Open a dashboard section over a date range in one history entry, so Back
 * returns to the section and range the reader left.
 *
 * @return The navigation, taking the section slug and the range to apply.
 */
export function useOpenSectionRange(): OpenSectionRange {
	const { effective, stage, commit } = useStagedSearch< SectionRangeSearch, string >( {} );

	return useCallback(
		( section, range, presetId = PRESET_CUSTOM ) => {
			const patch = buildRangePatch( {
				nextRange: range,
				nextPresetId: presetId,
				exactRange: true,
				effective,
			} );

			stage( { ...patch, section } );
			commit( { replace: false } );
		},
		[ effective, stage, commit ]
	);
}
