/**
 * External dependencies
 */
import { type DateRange } from '@jetpack-premium-analytics/datetime';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { NO_LOCKED_INTERVALS, type LockableInterval } from '../utils/interval';
import type { StatsDatePolicy } from '../utils/stats-date-policy';

/** The copy and links of the upsell beside a control's locked options. */
export type DateLimitUpsellCopy = {
	description: string;
	supportUrl: string;
	upgradeUrl: string;
	/** Called when the reader follows the upgrade link. */
	onUpgradeClick?: () => void;
};

/** Date options the site's plan withholds, for the controls to show as locked. */
export type DateLimits = Pick<
	StatsDatePolicy,
	'lockedPresetIds' | 'earliestDate' | 'lockedIntervals'
> & {
	/** Explains the locked periods. */
	upsell?: DateLimitUpsellCopy;
	/** Explains the locked chart intervals. */
	intervalUpsell?: DateLimitUpsellCopy;
};

/**
 * What the surface a widget or table is rendering on offers.
 */
export type ReportScope = {
	offersComparison: boolean;

	/**
	 * Applies a range a widget computed as the surface's period, drawing the date
	 * control's attention to it. Absent where the host offers none.
	 */
	openPeriod?: ( range: Required< DateRange > ) => void;
	/**
	 * The id the host's date control draws attention with while a period a widget set
	 * lands; undefined while nothing is pending. Travels with `openPeriod`.
	 */
	attentionId?: number;
	/** The date options the site's plan locks; absent where the host applies no limits. */
	dateLimits?: DateLimits;
};

// Undeclared hosts keep the comparison behavior they had before report scopes.
const DEFAULT_REPORT_SCOPE: ReportScope = { offersComparison: true };

const ReportScopeContext = createContext< ReportScope >( DEFAULT_REPORT_SCOPE );

/**
 * Declare what the surface below offers, over what an outer provider declared.
 *
 * @param props                  - Provider props.
 * @param props.offersComparison - Whether this surface offers the date comparison.
 * @param props.openPeriod       - How a widget sets this surface's period.
 * @param props.attentionId      - The id the host's date control draws attention with; undefined while nothing is pending.
 * @param props.dateLimits       - Date options the plan withholds.
 * @param props.children         - The surface's tree.
 * @return The provider.
 */
export function ReportScopeProvider( {
	offersComparison,
	openPeriod,
	attentionId,
	dateLimits,
	children,
}: Partial< ReportScope > & {
	children: ReactNode;
} ) {
	const inherited = useContext( ReportScopeContext );
	const value = useMemo(
		() => ( {
			...inherited,
			...( offersComparison !== undefined && { offersComparison } ),
			...( openPeriod && { openPeriod } ),
			...( attentionId !== undefined && { attentionId } ),
			...( dateLimits && { dateLimits } ),
		} ),
		[ inherited, offersComparison, openPeriod, attentionId, dateLimits ]
	);

	return <ReportScopeContext.Provider value={ value }>{ children }</ReportScopeContext.Provider>;
}

/**
 * Read what the nearest surface offers.
 *
 * @return The nearest declared scope, or the compatibility default.
 */
export function useReportScope(): ReportScope {
	return useContext( ReportScopeContext );
}

/**
 * Read the buckets the nearest surface's plan locks.
 *
 * @return The locked buckets, none where the host declares no date limits.
 */
export function useScopeLockedIntervals(): readonly LockableInterval[] {
	return useReportScope().dateLimits?.lockedIntervals ?? NO_LOCKED_INTERVALS;
}
