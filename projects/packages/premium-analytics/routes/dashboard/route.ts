/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	getSectionDatePolicy,
	needsReportDateParamsSeed,
} from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { dateWindowNoticeState } from '../date-window-notice';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { dashboardSectionOf, dateWindowNotice, limitStatsDateSearch } from '../stats-date-window';
import { seedDashboardDateSearch, type DashboardSearch } from './section-date-window';
import {
	dashboardSectionOf,
	limitStatsDateSearch,
	withoutCarriedYearWindow,
} from '../stats-date-window';
import {
	DASHBOARD_PATHNAME,
	seedDashboardDateSearch,
	type DashboardSearch,
} from './section-date-window';

/**
 * Route lifecycle for the dashboard. The initial analytics sync is not a guard
 * — only the store section waits on it and shows progress meanwhile (see
 * `stage.tsx`).
 */
export const route = {
	beforeLoad: async ( { search }: { search?: DashboardSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		const current: DashboardSearch = search ?? {};
		const policy = getSectionDatePolicy( dashboardSectionOf( current.section ) );
		const params = withoutCarriedYearWindow( current, policy );

		let next: Record< string, unknown > | undefined;
		// The seed check must read the same locks as the limit, or each undoes the other's interval.
		if ( needsReportDateParamsSeed( params, policy.lockedIntervals ) ) {
			/*
			 * Warm the core `site` record for `useSiteHomeUrl()`; a rejection should
			 * not error the page since the seed's own dates don't depend on it.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			next = seedDashboardDateSearch( params, policy );
		} else {
			next = limitStatsDateSearch( params, policy, { requested: params } );
		}

		if ( next ) {
			throw redirect( {
				to: '/',
				replace: true,
				viewTransition: false,
				/*
				 * The router is built dynamically, so '/' has no typed search schema
				 * (TanStack widens it to `never`); cast as the routing package does.
				 */
				search: next as unknown as never,
				state: dateWindowNoticeState( dateWindowNotice( params, policy ) ),
			} );
		}
	},
};
