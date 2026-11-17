/**
 * External dependencies
 */
import {
	useSettlePeriodChange,
	type DateLimits,
	type PeriodChange,
	type ReportScope,
} from '@jetpack-premium-analytics/data';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useCommitExactRange } from './use-commit-exact-range';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

type OpenPeriod = NonNullable< ReportScope[ 'openPeriod' ] >;

type PeriodHost = {
	/** Hand to `ReportScopeProvider`, for the widgets that set the period. */
	openPeriod: OpenPeriod;
	/** Hand its id to the date control and its range to `PeriodChangeStatus`, while it is set. */
	attention?: PeriodChange;
};

/**
 * Let the widgets on a surface set its period, and draw the date control's
 * attention when they do. Both come from one call, so a host wires them together.
 *
 * @param surface      - The surface's key: a dashboard section slug, or a `postSurface`.
 * @param appliedRange - The range its date control shows.
 * @param isShown      - Whether the date control is on screen.
 * @param dateLimits   - The buckets and the first day the surface's plan allows.
 * @return The period the widgets open, and the attention the control draws.
 */
export function usePeriodHost(
	surface: string,
	appliedRange: DateRange | undefined,
	isShown: boolean,
	dateLimits?: Pick< DateLimits, 'lockedIntervals' | 'earliestDate' >
): PeriodHost {
	const commitExactRange = useCommitExactRange();
	const attention = useSettlePeriodChange( surface, appliedRange, isShown );
	const lockedIntervals = dateLimits?.lockedIntervals;
	const earliestDate = dateLimits?.earliestDate;

	const openPeriod = useCallback< OpenPeriod >(
		range => commitExactRange( surface, range, { lockedIntervals, earliestDate } ),
		[ commitExactRange, surface, lockedIntervals, earliestDate ]
	);

	return { openPeriod, attention };
}
