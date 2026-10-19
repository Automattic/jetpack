/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	getSectionDatePolicy,
	isPresetLockedByPolicy,
	needsReportDateParamsSeed,
} from '@jetpack-premium-analytics/data';
import { isYearSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import { omitReportDateParams } from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { dashboardSectionOf, limitStatsDateSearch } from '../stats-date-window';
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
		// A locked year or all time is treated as Insights' window (a shared link takes the same path): open on the default.
		const params =
			isYearSurfacePresetId( current.preset ) && isPresetLockedByPolicy( current.preset, policy )
				? omitReportDateParams( current )
				: { ...current };

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
			next = limitStatsDateSearch( params, policy, {
				pathname: DASHBOARD_PATHNAME,
				requested: params,
			} );
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
			} );
		}
	},
};
