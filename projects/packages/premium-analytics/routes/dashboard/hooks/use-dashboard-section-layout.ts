import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
import { isDashboardSectionLayouts } from '../config';
import { DASHBOARD_PREFERENCES_SCOPE } from './constants';
import { useDashboardLayout } from './use-dashboard-layout';
import type { DashboardSection, DashboardSectionId, DashboardSectionLayouts } from '../config';
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
 * route layers a section map on top of that hook so each section can commit its
 * own customized layout, while reset restores the section's bundled default.
 *
 * The default comes from the active section's `default_layout`, carried on the
 * `dashboardSection` record, so reset is a local store write with no request.
 *
 * @param dashboardName   - Dashboard registration name for the base layout.
 * @param activeSectionId - Currently active section slug.
 * @param sections        - The available sections, carrying their defaults.
 * @return Active section layout, setter, and reset action.
 */
export function useDashboardSectionLayout(
	dashboardName: DashboardName,
	activeSectionId: DashboardSectionId,
	sections: DashboardSection[]
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => void ] {
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

	const resetLayout = useCallback( () => {
		const sectionDefault =
			sections.find( section => section.slug === activeSectionId )?.default_layout ?? [];

		void set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			...sectionLayouts,
			[ activeSectionId ]: sectionDefault,
		} );
	}, [ sections, activeSectionId, sectionLayouts, set ] );

	return [ layout, setLayout, resetLayout ];
}
