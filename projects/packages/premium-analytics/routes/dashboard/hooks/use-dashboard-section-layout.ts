import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
import { isDashboardSectionLayouts } from '../config';
import { DASHBOARD_PREFERENCES_SCOPE } from './constants';
import type { DashboardSection, DashboardSectionId, DashboardSectionLayouts } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const PREFERENCES_KEY = 'dashboardSectionLayouts';
const EMPTY_SECTION_LAYOUTS: DashboardSectionLayouts = {};

/**
 * Widget types a later release replaced, mapped to what replaced them.
 *
 * A customized layout stores widget types by name and nothing reconciles it
 * against the registry — a type that no longer exists stays put as a removable
 * ghost (see `src/widget-type-support.php`). That is right for a widget the
 * site simply cannot have, but wrong for one that was *replaced*: the reader
 * would keep a "Missing widget" tile and never meet its replacement, because a
 * new default layout only reaches sections nobody has customized.
 *
 * Mapping on read puts the replacement in the slot the original held. The
 * mapped layout is deliberately not written back — the reader's next edit
 * persists it, so a read alone never mutates stored preferences.
 */
const REPLACED_WIDGET_TYPES: Record< string, DashboardWidget[ 'type' ] > = {
	'jpa/traffic-views-activity': 'jpa/views-over-years',
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

	const layout = useMemo( () => {
		const stored = Object.hasOwn( sectionLayouts, activeSectionId )
			? sectionLayouts[ activeSectionId ] ?? sectionDefault
			: sectionDefault;

		// Returned as-is unless something actually maps: a layout that is the
		// section's own default must stay identical to it by reference, which is
		// how `resetLayout` and its tests tell "following the default" apart from
		// "customized to the same thing".
		if ( ! stored.some( widget => REPLACED_WIDGET_TYPES[ widget.type ] ) ) {
			return stored;
		}

		return stored.map( widget => {
			const replacement = REPLACED_WIDGET_TYPES[ widget.type ];

			return replacement ? { ...widget, type: replacement } : widget;
		} );
	}, [ sectionLayouts, activeSectionId, sectionDefault ] );

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
