/**
 * External dependencies
 */
import {
	useSettlePeriodChange,
	type LockableInterval,
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
	/** Hand to the date control, which draws attention while it is set. */
	attentionId?: number;
};

/**
 * Let the widgets on a surface set its period, and draw the date control's
 * attention when they do. Both come from one call, so a host wires them together.
 *
 * @param surface             - The surface's key: a dashboard section slug, or a `postSurface`.
 * @param appliedRange        - The range its date control shows.
 * @param isShown             - Whether the date control is on screen.
 * @param lockedIntervals     - The buckets the surface's plan locks.
 * @param options             - Host options.
 * @param options.withZoomOut - Keep the window a widget zooms in from, for a date control that offers the zoom out.
 * @return The period the widgets open, and the attention the control draws.
 */
export function usePeriodHost(
	surface: string,
	appliedRange: DateRange | undefined,
	isShown: boolean,
	lockedIntervals?: readonly LockableInterval[],
	{ withZoomOut = false }: { withZoomOut?: boolean } = {}
): PeriodHost {
	const commitExactRange = useCommitExactRange();
	const attentionId = useSettlePeriodChange( surface, appliedRange, isShown );

	const openPeriod = useCallback< OpenPeriod >(
		range => commitExactRange( surface, range, { lockedIntervals, withZoomOut } ),
		[ commitExactRange, surface, lockedIntervals, withZoomOut ]
	);

	return { openPeriod, attentionId };
}
