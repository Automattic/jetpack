/**
 * External dependencies
 */
import {
	DASHBOARD_ORIGIN_PARAM,
	pickDashboardOriginParams,
} from '@jetpack-premium-analytics/routing';
import { useSearch } from '@wordpress/route';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

// Lives in this shared script module so the dashboard page and every widget
// bundle read the same context instance.
const DashboardSectionContext = createContext< string | undefined >( undefined );

/**
 * Declare the dashboard tab rendering the tree below, so links out of it can
 * name the tab to return to.
 *
 * @param props          - Provider props.
 * @param props.section  - The resolved active dashboard section.
 * @param props.children - The section's tree.
 * @return The provider.
 */
export function DashboardSectionProvider( {
	section,
	children,
}: {
	section: string;
	children: ReactNode;
} ) {
	return (
		<DashboardSectionContext.Provider value={ section }>
			{ children }
		</DashboardSectionContext.Provider>
	);
}

/**
 * The search params that carry the dashboard origin on a link out of this page:
 * the active tab on the dashboard, otherwise the origin already in the URL.
 *
 * @return The dashboard origin param, when one is known.
 */
export function useDashboardOriginSearch(): Record< string, string > {
	const dashboardSection = useContext( DashboardSectionContext );
	let search: Record< string, unknown > | undefined;

	// `useSearch` throws outside a matched route (e.g. Storybook).
	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks -- useSearch may throw outside a matched route
		search = useSearch( { strict: false } ) as Record< string, unknown >;
	} catch {
		search = undefined;
	}

	const carried = pickDashboardOriginParams( search )[ DASHBOARD_ORIGIN_PARAM ];
	const section = dashboardSection ?? carried;

	return useMemo( () => ( section ? { [ DASHBOARD_ORIGIN_PARAM ]: section } : {} ), [ section ] );
}
