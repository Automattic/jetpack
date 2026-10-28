/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	FreeSiteUpgradeNotice,
	useFreeSiteUpgradeNoticeVisibility,
} from '../free-site-upgrade-notice';
import { PlanLimitNotice } from '../plan-limit-notice';
import { hasPurchaseSuccess, PurchaseSuccessNotice } from '../purchase-success-notice';
import type { JSX } from 'react';

/**
 * Picks the first notice that applies, in Stats' priority order. A notice waits while a
 * higher-priority one is still loading, so the reader never sees one replaced by another.
 *
 * @return The notice, or nothing.
 */
function ConnectedNotices(): JSX.Element | null {
	const showFreeSiteUpgrade = useFreeSiteUpgradeNoticeVisibility();

	// A checkout return holds the other notices back for the whole load, even once dismissed.
	if ( hasPurchaseSuccess() ) {
		return <PurchaseSuccessNotice />;
	}

	if ( showFreeSiteUpgrade === undefined ) {
		return null;
	}

	if ( showFreeSiteUpgrade ) {
		return <FreeSiteUpgradeNotice />;
	}

	return <PlanLimitNotice />;
}

/**
 * The Stats notices above a section, one at a time. Brings its own query provider,
 * since the dashboard stage has none.
 *
 * @return The notice, or nothing.
 */
export function DashboardNotices(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<ConnectedNotices />
		</AnalyticsQueryClientProvider>
	);
}
