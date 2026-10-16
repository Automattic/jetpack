/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	getStatsDatePolicy,
	isPresetLockedByPolicy,
	needsReportDateParamsSeed,
} from '@jetpack-premium-analytics/data';
import { isYearSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import { REPORT_DATE_PARAM_KEYS } from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { isPlanDateLimitedSection, limitStatsDateSearch } from '../stats-date-window';
import { seedDashboardDateSearch, type DashboardSearch } from './section-date-window';

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

		const params = { ...search } as DashboardSearch;
		const policy = isPlanDateLimitedSection( params.section ) ? getStatsDatePolicy() : undefined;
		// A locked year or all time is treated as Insights' window (a shared link takes the same path): open on the default.
		if (
			policy &&
			isYearSurfacePresetId( params.preset ) &&
			isPresetLockedByPolicy( params.preset, policy )
		) {
			for ( const key of REPORT_DATE_PARAM_KEYS ) {
				delete params[ key ];
			}
		}
		// The seed check must read the same locks as the limit, or each undoes the other's interval.
		const lockedIntervals = policy?.lockedIntervals;

		if ( needsReportDateParamsSeed( params, lockedIntervals ) ) {
			/*
			 * Warm the core `site` record for `useSiteHomeUrl()`; a rejection should
			 * not error the page since the seed's own dates don't depend on it.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			throw redirect( {
				to: '/',
				replace: true,
				viewTransition: false,
				/*
				 * The router is built dynamically, so '/' has no typed search schema
				 * (TanStack widens it to `never`); cast as the routing package does.
				 */
				search: seedDashboardDateSearch( params, policy ) as unknown as never,
			} );
		}

		const limited = policy ? limitStatsDateSearch( params ) : undefined;
		if ( limited ) {
			throw redirect( {
				to: '/',
				replace: true,
				viewTransition: false,
				search: limited as unknown as never,
			} );
		}
	},
};
