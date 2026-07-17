import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
import { isDashboardSectionLayouts } from '../config';
import { DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_REST_NAMESPACE } from './constants';
import { useDashboardLayout } from './use-dashboard-layout';
import type { DashboardSectionId, DashboardSectionLayouts } from '../config';
import type { DashboardName } from './use-dashboard-layout';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const PREFERENCES_KEY = 'dashboardSectionLayouts';
const EMPTY_SECTION_LAYOUTS: DashboardSectionLayouts = {};

type PreferencesActions = {
	set: ( scope: string, key: string, value: DashboardSectionLayouts ) => Promise< void > | void;
};

/**
 * Manage the customizable widget layout for the currently active dashboard section.
 *
 * The shared `useDashboardLayout` hook stores one dashboard-wide layout. This
 * route layers a section map on top of that hook so each section can commit
 * its own customized layout while reset can fetch the active section's bundled
 * default.
 *
 * @param dashboardName   - Dashboard registration name for fetching defaults.
 * @param activeSectionId - Currently active section ID.
 * @return Active section layout, setter, and reset action.
 */
export function useDashboardSectionLayout(
	dashboardName: DashboardName,
	activeSectionId: DashboardSectionId
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => Promise< void > ] {
	const [ defaultLayout ] = useDashboardLayout( dashboardName );

	const sectionLayouts = useSelect( select => {
		const value = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, key: string ) => unknown;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY );

		return isDashboardSectionLayouts( value ) ? value : EMPTY_SECTION_LAYOUTS;
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const layout = useMemo(
		() => sectionLayouts[ activeSectionId ] ?? defaultLayout,
		[ activeSectionId, defaultLayout, sectionLayouts ]
	);

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			void set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
				...sectionLayouts,
				[ activeSectionId ]: nextLayout,
			} );
		},
		[ activeSectionId, sectionLayouts, set ]
	);

	const resetLayout = useCallback( async () => {
		const fresh = ( await apiFetch( {
			path: `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ activeSectionId }/default-layout`,
		} ) ) as DashboardWidget[];

		void set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			...sectionLayouts,
			[ activeSectionId ]: fresh,
		} );
	}, [ activeSectionId, sectionLayouts, set ] );

	return [ layout, setLayout, resetLayout ];
}
