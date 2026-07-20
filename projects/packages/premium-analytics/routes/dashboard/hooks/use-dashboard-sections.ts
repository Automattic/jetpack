/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import {
	getDashboardSectionsPath,
	getPreloadedDashboardSections,
	normalizeDashboardSections,
	type DashboardSection,
} from '../config';

/**
 * Get the ordered list of dashboard sections from the server-side registry.
 *
 * The section list — which tabs exist, in what order, labelled how — is
 * server-driven via `GET /sections`, so conditional sections (e.g. the store
 * section, present only when WooCommerce is active) never render a dead tab.
 *
 * The dashboard page render preloads the response into script data, so the
 * list is resolved synchronously on first render — no tab-bar flash. The
 * REST request only runs when the preload is absent (e.g. a stale page
 * render); it resolves from the same registry.
 *
 * @param dashboardName - Dashboard registration name.
 * @return The ordered list of dashboard sections.
 */
export function useDashboardSections( dashboardName: string ): DashboardSection[] {
	const [ sections, setSections ] = useState< DashboardSection[] >( () =>
		getPreloadedDashboardSections( dashboardName )
	);

	useEffect( () => {
		if ( getPreloadedDashboardSections( dashboardName ).length > 0 ) {
			return;
		}

		let cancelled = false;

		apiFetch( { path: getDashboardSectionsPath( dashboardName ) } )
			.then( response => {
				if ( ! cancelled ) {
					setSections( normalizeDashboardSections( response ) );
				}
			} )
			.catch( () => {
				// Leave the section list empty; the dashboard renders no tabs
				// rather than inventing a stale static list.
			} );

		return () => {
			cancelled = true;
		};
	}, [ dashboardName ] );

	return sections;
}
