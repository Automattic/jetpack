import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo, useState } from 'react';
import {
	NO_WIDGET_TYPE_RENAMES,
	isDashboardSectionLayouts,
	resolveLayoutTypes,
} from '../../config';
import { DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY } from '../constants';
import type {
	DashboardSection,
	DashboardSectionId,
	DashboardSectionLayouts,
	WidgetTypeName,
} from '../../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

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
 * A layout saved under a former widget type name renders the current type: the stored items are
 * renamed through `renames` on the way out, with no write-back, so the current name persists
 * with the section's next commit. The default needs no renaming: the server resolves former
 * names in it before it reaches the record.
 *
 * @param activeSectionId - Currently active section slug.
 * @param sections        - The available sections, carrying their defaults.
 * @param renames         - Former widget type names mapped to current ones, from the widget module records.
 * @return Active section layout, setter, and reset action.
 */
export function useDashboardSectionLayout(
	activeSectionId: DashboardSectionId,
	sections: DashboardSection[],
	renames: ReadonlyMap< string, WidgetTypeName > = NO_WIDGET_TYPE_RENAMES
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => void ] {
	const sectionLayouts = useSelect( select => {
		const value = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, key: string ) => unknown;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY );

		return isDashboardSectionLayouts( value ) ? value : EMPTY_SECTION_LAYOUTS;
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const sectionDefault = useMemo(
		() => sections.find( section => section.slug === activeSectionId )?.default_layout ?? [],
		[ sections, activeSectionId ]
	);

	// A reset has to change the layout's identity, or the dashboard keeps its staged
	// edits: the same workaround as `useStoredDetailLayout` (WordPress/gutenberg#82850).
	const [ resetCount, setResetCount ] = useState( 0 );
	const layout = useMemo( () => {
		if ( Object.hasOwn( sectionLayouts, activeSectionId ) ) {
			const stored = sectionLayouts[ activeSectionId ];
			return stored ? resolveLayoutTypes( stored, renames ) : sectionDefault;
		}
		return resetCount ? [ ...sectionDefault ] : sectionDefault;
	}, [ sectionLayouts, activeSectionId, sectionDefault, resetCount, renames ] );

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY, {
				...sectionLayouts,
				[ activeSectionId ]: nextLayout,
			} );
		},
		[ activeSectionId, sectionLayouts, set ]
	);

	const resetLayout = useCallback( () => {
		if ( ! Object.hasOwn( sectionLayouts, activeSectionId ) ) {
			setResetCount( count => count + 1 );
			return;
		}

		const nextLayouts = { ...sectionLayouts };
		delete nextLayouts[ activeSectionId ];
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY, nextLayouts );
	}, [ activeSectionId, sectionLayouts, set ] );

	return [ layout, setLayout, resetLayout ];
}
