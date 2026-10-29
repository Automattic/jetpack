/**
 * External dependencies
 */
import { getSectionDatePolicy } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { dateWindowRedirect } from '../date-window-redirect';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { dashboardSectionOf, withoutCarriedYearWindow } from '../stats-date-window';
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

		const current: DashboardSearch = search ?? {};
		const policy = getSectionDatePolicy( dashboardSectionOf( current.section ) );
		const params = withoutCarriedYearWindow( current, policy );

		const limited = await dateWindowRedirect( params, policy, {
			seed: next => seedDashboardDateSearch( next, policy ),
			requested: params,
		} );
		if ( limited ) {
			throw redirect( {
				to: '/',
				replace: true,
				viewTransition: false,
				/*
				 * The router is built dynamically, so '/' has no typed search schema
				 * (TanStack widens it to `never`); cast as the routing package does.
				 */
				search: limited.search as unknown as never,
				state: limited.state,
			} );
		}
	},
};
