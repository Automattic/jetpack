import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
import { isDashboardSectionLayouts } from '../config';
import { DASHBOARD_PREFERENCES_SCOPE } from './constants';
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
 * Reads the customized layout from the preferences map, falling back to the
 * section's `default_layout` from the `dashboardSection` record. Reset deletes
 * the section's entry instead of writing the default's contents: a stored
 * snapshot would shadow the entity default forever, pinning users who asked to
 * follow the default to whatever it happened to be at reset time.
 *
 * @param activeSectionId - Currently active section slug.
 * @param sections        - The available sections, carrying their defaults.
 * @return Active section layout, setter, and reset action.
 */
export function useDashboardSectionLayout(
	activeSectionId: DashboardSectionId,
	sections: DashboardSection[]
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => void ] {
	const sectionLayouts = useSelect( select => {
		const value = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, key: string ) => unknown;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY );

		return isDashboardSectionLayouts( value ) ? value : EMPTY_SECTION_LAYOUTS;
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const sectionDefault = useMemo(
		() => sections.find( section => section.slug === activeSectionId )?.default_layout ?? [],
		[ sections, activeSectionId ]
	);

	const layout = Object.hasOwn( sectionLayouts, activeSectionId )
		? sectionLayouts[ activeSectionId ] ?? sectionDefault
		: sectionDefault;

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
		if ( ! Object.hasOwn( sectionLayouts, activeSectionId ) ) {
			return;
		}

		const nextLayouts = { ...sectionLayouts };
		delete nextLayouts[ activeSectionId ];
		void set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, nextLayouts );
	}, [ activeSectionId, sectionLayouts, set ] );

	return [ layout, setLayout, resetLayout ];
}
