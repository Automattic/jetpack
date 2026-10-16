/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useCommitExactRange } from '../use-period-host/use-commit-exact-range';
import type { LockableInterval } from '@jetpack-premium-analytics/data';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

export type OpenSectionRange = ( section: string, range: Required< DateRange > ) => void;

/**
 * Open a dashboard section over an exact date range, stored as a custom
 * period, in one history entry so Back returns to where the reader left.
 *
 * @param lockedIntervals - The buckets the plan locks on the section it opens.
 * @return The navigation, taking the section slug and the range to apply.
 */
export function useOpenSectionRange(
	lockedIntervals?: readonly LockableInterval[]
): OpenSectionRange {
	const commitExactRange = useCommitExactRange( lockedIntervals );

	return useCallback(
		( section, range ) => commitExactRange( section, range, { opensSection: true } ),
		[ commitExactRange ]
	);
}
