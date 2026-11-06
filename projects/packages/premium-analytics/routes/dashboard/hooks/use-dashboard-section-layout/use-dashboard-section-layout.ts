import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
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

// A stored layout is positional, so a default's `order` would rank the widget ahead of its slot.
const withoutOrder = ( widget: DashboardWidget ): DashboardWidget => {
	if ( ! widget.placement ) {
		return widget;
	}
	const placement = { ...widget.placement };
	delete placement.order;
	return { ...widget, placement };
};

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
 * follow the default to whatever it happened to be at reset time. A reset that
 * keeps some widgets writes them back only when they differ from the default's.
 *
 * A layout saved under a former widget type name renders the current type: the stored items are
 * renamed through `renames` on the way out, with no write-back, so the current name persists
 * with the section's next commit. The default needs no renaming: the server resolves former
 * names in it before it reaches the record.
 *
 * @param activeSectionId - Currently active section slug.
 * @param sections        - The available sections, carrying their defaults.
 * @param renames         - Former widget type names mapped to current ones, from the widget module records.
 * @return Active section layout, setter, and reset action; the reset leaves the widgets an optional `keep( widget )` accepts as stored.
 */
export function useDashboardSectionLayout(
	activeSectionId: DashboardSectionId,
	sections: DashboardSection[],
	renames: ReadonlyMap< string, WidgetTypeName > = NO_WIDGET_TYPE_RENAMES
): [
	DashboardWidget[],
	( layout: DashboardWidget[] ) => void,
	( keep?: ( widget: DashboardWidget ) => boolean ) => void,
] {
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

	const resetLayout = useCallback(
		( keep?: ( widget: DashboardWidget ) => boolean ) => {
			if ( ! Object.hasOwn( sectionLayouts, activeSectionId ) ) {
				setResetCount( count => count + 1 );
				return;
			}

			if ( keep ) {
				const next = layout.filter( keep );
				if ( ! fastDeepEqual( next, sectionDefault.filter( keep ) ) ) {
					// The default's other widgets take the slot of the first stored one they replace.
					const slot = layout.findIndex( widget => ! keep( widget ) );
					next.splice(
						slot === -1 ? next.length : slot,
						0,
						...sectionDefault.filter( widget => ! keep( widget ) ).map( withoutOrder )
					);
					setLayout( next );
					return;
				}
			}

			const nextLayouts = { ...sectionLayouts };
			delete nextLayouts[ activeSectionId ];
			void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY, nextLayouts );
		},
		[ activeSectionId, layout, sectionDefault, sectionLayouts, set, setLayout ]
	);

	return [ layout, setLayout, resetLayout ];
}
