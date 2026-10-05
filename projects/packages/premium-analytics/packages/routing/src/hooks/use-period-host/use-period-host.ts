/**
 * External dependencies
 */
import { useSettlePeriodChange, type ReportScope } from '@jetpack-premium-analytics/data';
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
 * attention when they do. One hook, so a host cannot offer one without the other.
 *
 * @param surface      - The surface's key: a dashboard section slug, or a `postSurface`.
 * @param appliedRange - The range its date control shows.
 * @param isShown      - Whether the date control is on screen.
 * @return The period the widgets open, and the attention the control draws.
 */
export function usePeriodHost(
	surface: string,
	appliedRange: DateRange | undefined,
	isShown: boolean
): PeriodHost {
	const commitExactRange = useCommitExactRange();
	const attentionId = useSettlePeriodChange( surface, appliedRange, isShown );

	const openPeriod = useCallback< OpenPeriod >(
		range => commitExactRange( surface, range ),
		[ commitExactRange, surface ]
	);

	return { openPeriod, attentionId };
}
