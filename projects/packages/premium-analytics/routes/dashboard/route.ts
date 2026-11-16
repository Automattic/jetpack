/**
 * External dependencies
 */
import { getSectionDatePolicy } from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { dateWindowRedirect } from '../date-window-redirect';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { dashboardSectionOf, withoutCarriedYearWindow } from '../stats-date-window';
import { WIDGET_MODULES_QUERY } from '../use-widget-modules';
import { DASHBOARD_SECTIONS_QUERY } from './hooks/use-dashboard-sections';
import { seedDashboardDateSearch, type DashboardSearch } from './section-date-window';

// Settings was a dashboard tab before it had a route; the server keeps the slug reserved.
const SETTINGS_SECTION = 'settings';

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
		if ( current.section === SETTINGS_SECTION ) {
			const settingsSearch = { ...current };
			delete settingsSearch.section;
			throw redirect( {
				to: '/settings',
				replace: true,
				// Cast for the same reason as the redirect below.
				search: settingsSearch as unknown as never,
			} );
		}

		const policy = getSectionDatePolicy( dashboardSectionOf( current.section ) );
		const params = withoutCarriedYearWindow( current, policy );

		const limited = dateWindowRedirect( params, policy, {
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
	// Boot runs this alongside its REST index fetch, so the sections and widget types the stage
	// reads go out in parallel with it. Same queries as the hooks, or core-data fetches twice.
	loader: () => {
		const core = resolveSelect( coreStore );
		core.getEntityRecords( 'root', 'dashboardSection', DASHBOARD_SECTIONS_QUERY ).catch( () => {} );
		core.getEntityRecords( 'root', 'widgetModule', WIDGET_MODULES_QUERY ).catch( () => {} );
	},
};
