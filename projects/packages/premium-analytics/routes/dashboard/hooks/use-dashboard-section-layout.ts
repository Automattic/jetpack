import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
import { isDashboardSectionLayouts } from '../config';
import { DASHBOARD_PREFERENCES_SCOPE } from './constants';
import { useDashboardLayout } from './use-dashboard-layout';
import type { DashboardSection, DashboardSectionId, DashboardSectionLayouts } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const PREFERENCES_KEY = 'dashboardSectionLayouts';
const EMPTY_SECTION_LAYOUTS: DashboardSectionLayouts = {};

type PreferencesActions = {
	set: ( scope: string, key: string, value: DashboardSectionLayouts ) => Promise< void > | void;
};

/**
 * Manage the customizable widget layout for the active dashboard section.
 *
 * Layers a per-section map over the dashboard-wide `useDashboardLayout`, so each
 * section keeps its own layout. Reset restores the section's `default_layout`
 * from the `dashboardSection` record: a local store write, no request.
 *
 * @param activeSectionId - Currently active section slug.
 * @param sections        - The available sections, carrying their defaults.
 * @return Active section layout, setter, and reset action.
 */
export function useDashboardSectionLayout(
	activeSectionId: DashboardSectionId,
	sections: DashboardSection[]
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => void ] {
	const defaultLayout = useDashboardLayout();

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
