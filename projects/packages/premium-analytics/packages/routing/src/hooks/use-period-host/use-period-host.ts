/**
 * External dependencies
 */
import {
	useSettlePeriodChange,
	type LockableInterval,
	type PeriodChange,
	type ReportScope,
} from '@jetpack-premium-analytics/data';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useCommitExactRange } from './use-commit-exact-range';

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
 * @param surface         - The surface's key: a dashboard section slug, or a `postSurface`.
 * @param isShown         - Whether the date control is on screen.
 * @param lockedIntervals - The buckets the surface's plan locks.
 * @return The period the widgets open, and the attention the control draws.
 */
export function usePeriodHost(
	surface: string,
	isShown: boolean,
	lockedIntervals?: readonly LockableInterval[]
): PeriodHost {
	const commitExactRange = useCommitExactRange();
	const attention = useSettlePeriodChange( surface, isShown );

	const openPeriod = useCallback< OpenPeriod >(
		range => commitExactRange( surface, range, { lockedIntervals } ),
		[ commitExactRange, surface, lockedIntervals ]
	);

	return { openPeriod, attention };
}
