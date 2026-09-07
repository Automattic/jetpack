import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

// One preference per detail route, holding every layout the page can show.
const PREFERENCES_KEY = 'layouts';

/**
 * One stored card: which fixed-composition widget it is, and where the user
 * put it. Attributes are deliberately absent — the compositions pin per-card
 * attributes (the email tabs inject dated report params on every render), so
 * persisting them would freeze values that must stay fresh.
 */
type StoredWidget = {
	uuid: string;
	placement?: DashboardWidget[ 'placement' ];
};

type StoredLayouts = Partial< Record< string, StoredWidget[] > >;

const EMPTY_LAYOUTS: StoredLayouts = {};

type PreferencesActions = {
	set: ( scope: string, key: string, value: StoredLayouts ) => Promise< void > | void;
};

/**
 * Narrow an arbitrary stored preference to the layouts map.
 *
 * @param value - The stored preference value.
 * @return Whether the value is a usable layouts map.
 */
function isStoredLayouts( value: unknown ): value is StoredLayouts {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return false;
	}

	return Object.values( value as Record< string, unknown > ).every(
		entry =>
			Array.isArray( entry ) &&
			entry.every(
				item =>
					!! item &&
					typeof item === 'object' &&
					typeof ( item as { uuid?: unknown } ).uuid === 'string'
			)
	);
}

/**
 * Rebuild a layout from its stored membership and placements.
 *
 * The stored entry carries order, membership, and placement; everything else —
 * type, attributes, and any params the composition injects — always comes from
 * the current fixed layout, so a stored card can never pin stale attributes. A
 * stored uuid the composition no longer ships is dropped; a fixed card absent
 * from the store stays removed, matching how the dashboard treats its stored
 * section layouts.
 *
 * @param stored - The stored cards, in display order.
 * @param fixed  - The current fixed composition.
 * @return The layout to render.
 */
function applyStoredLayout( stored: StoredWidget[], fixed: DashboardWidget[] ): DashboardWidget[] {
	const byUuid = new Map( fixed.map( widget => [ widget.uuid, widget ] ) );

	return stored.flatMap( entry => {
		const fixedWidget = byUuid.get( entry.uuid );
		if ( ! fixedWidget ) {
			return [];
		}

		return [ { ...fixedWidget, ...( entry.placement ? { placement: entry.placement } : {} ) } ];
	} );
}

/**
 * Manage the customized card arrangement of one detail-page layout.
 *
 * Reads the stored arrangement from preferences, falling back to the fixed
 * composition. Reset deletes the entry rather than writing the fixed layout
 * back, so a reset layout keeps following the composition as it evolves.
 *
 * @param scope       - The route's preferences scope; each detail route keeps its own.
 * @param layoutId    - Which of the route's layouts this is: a tab id, or one fixed id.
 * @param fixedLayout - The fixed composition (with any injected params already applied).
 * @return The layout with any stored arrangement applied, plus the setters.
 */
export function useStoredDetailLayout(
	scope: string,
	layoutId: string,
	fixedLayout: DashboardWidget[]
) {
	const layouts = useSelect(
		select => {
			const value = (
				select( preferencesStore ) as unknown as {
					get: ( preferencesScope: string, key: string ) => unknown;
				}
			 ).get( scope, PREFERENCES_KEY );

			return isStoredLayouts( value ) ? value : EMPTY_LAYOUTS;
		},
		[ scope ]
	);

	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const stored = Object.hasOwn( layouts, layoutId ) ? layouts[ layoutId ] : undefined;

	const layout = useMemo(
		() => ( stored ? applyStoredLayout( stored, fixedLayout ) : fixedLayout ),
		[ stored, fixedLayout ]
	);

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			void set( scope, PREFERENCES_KEY, {
				...layouts,
				[ layoutId ]: nextLayout.map( ( { uuid, placement } ) => ( {
					uuid,
					...( placement ? { placement } : {} ),
				} ) ),
			} );
		},
		[ scope, layoutId, layouts, set ]
	);

	const resetLayout = useCallback( () => {
		if ( ! Object.hasOwn( layouts, layoutId ) ) {
			return;
		}

		const nextLayouts = { ...layouts };
		delete nextLayouts[ layoutId ];
		void set( scope, PREFERENCES_KEY, nextLayouts );
	}, [ scope, layoutId, layouts, set ] );

	return {
		layout,
		setLayout,
		resetLayout,
		hasCustomLayout: stored !== undefined,
	};
}
