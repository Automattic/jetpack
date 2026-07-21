/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DASHBOARD_LAYOUT_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_REST_NAMESPACE,
} from '../constants';
import type { DashboardWidget } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */

/**
 * Identifier of a dashboard, structured as `<plugin>_<page>` to mirror
 * the underscore form produced by the wp-build pipeline (see
 * `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` in the page templates).
 */
export type DashboardName = `${ string }_${ string }`;

/**
 * Hook for managing dashboard layout preferences.
 *
 * Returns the persisted layout, a setter that writes through to the
 * preferences store, and a reset action that fetches the dashboard's
 * registered default from the REST API and applies it locally.
 *
 * @param dashboardName - Identifier of the dashboard as produced by the
 *                      build pipeline. Used as the `{name}` segment of
 *                      the default-layout route.
 * @return Tuple `[ layout, setLayout, resetLayout ]`.
 */
export function useDashboardLayout(
	dashboardName: DashboardName
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => Promise< void > ] {
	const layout = useSelect( select => {
		const stored = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, name: string ) => DashboardWidget[] | undefined;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_LAYOUT_KEY );
		return stored ?? [];
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as {
		set: ( scope: string, name: string, value: DashboardWidget[] ) => void;
	};

	/**
	 * Persists the dashboard widget layout to user preferences.
	 *
	 * @param newLayout - Widget layout to persist.
	 */
	function setLayout( newLayout: DashboardWidget[] ) {
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_LAYOUT_KEY, newLayout );
	}

	/**
	 * Resets the layout to the server-provided default for this dashboard.
	 */
	async function resetLayout() {
		const fresh = ( await apiFetch( {
			path: `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ dashboardName }/default-layout`,
		} ) ) as DashboardWidget[];

		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_LAYOUT_KEY, fresh );
	}

	return [ layout, setLayout, resetLayout ];
}
