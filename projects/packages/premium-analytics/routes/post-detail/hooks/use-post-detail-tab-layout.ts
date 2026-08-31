/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import type { PostDetailTabId } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Preferences scope holding the post-detail page's stored state. Its own scope
 * rather than the dashboard's: the routes are separate packages, and the two
 * surfaces' preferences have no reason to share a namespace.
 */
const PREFERENCES_SCOPE = 'jetpack-premium-analytics/post-detail';

const PREFERENCES_KEY = 'tabLayouts';

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

type StoredTabLayouts = Partial< Record< string, StoredWidget[] > >;

const EMPTY_TAB_LAYOUTS: StoredTabLayouts = {};

type PreferencesActions = {
	set: ( scope: string, key: string, value: StoredTabLayouts ) => Promise< void > | void;
};

/**
 * Narrow an arbitrary stored preference to the tab-layouts map.
 *
 * @param value - The stored preference value.
 * @return Whether the value is a usable tab-layouts map.
 */
function isStoredTabLayouts( value: unknown ): value is StoredTabLayouts {
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
 * Rebuild a tab's layout from its stored membership and placements.
 *
 * The stored entry carries order, membership, and placement; everything else —
 * type, attributes, and any params the composition injects — always comes from
 * the current fixed layout, so a stored card can never pin stale attributes. A
 * stored uuid the composition no longer ships is dropped; a fixed card absent
 * from the store stays removed, matching how the dashboard treats its stored
 * section layouts.
 *
 * @param stored - The stored cards for the tab, in display order.
 * @param fixed  - The tab's current fixed composition.
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
 * Manage the customized card arrangement for a post-detail tab.
 *
 * Reads the stored arrangement from preferences, falling back to the tab's
 * fixed composition. Reset deletes the tab's entry rather than writing the
 * fixed layout back, so a reset tab keeps following the composition as it
 * evolves.
 *
 * @param activeTab   - The tab whose layout is shown.
 * @param fixedLayout - The tab's fixed composition (email tabs: with pinned params injected).
 * @return The layout with any stored arrangement applied, plus the setters.
 */
export function usePostDetailTabLayout(
	activeTab: PostDetailTabId,
	fixedLayout: DashboardWidget[]
) {
	const tabLayouts = useSelect( select => {
		const value = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, key: string ) => unknown;
			}
		 ).get( PREFERENCES_SCOPE, PREFERENCES_KEY );

		return isStoredTabLayouts( value ) ? value : EMPTY_TAB_LAYOUTS;
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const stored = Object.hasOwn( tabLayouts, activeTab ) ? tabLayouts[ activeTab ] : undefined;

	const layout = useMemo(
		() => ( stored ? applyStoredLayout( stored, fixedLayout ) : fixedLayout ),
		[ stored, fixedLayout ]
	);

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			void set( PREFERENCES_SCOPE, PREFERENCES_KEY, {
				...tabLayouts,
				[ activeTab ]: nextLayout.map( ( { uuid, placement } ) => ( {
					uuid,
					...( placement ? { placement } : {} ),
				} ) ),
			} );
		},
		[ activeTab, tabLayouts, set ]
	);

	const resetLayout = useCallback( () => {
		if ( ! Object.hasOwn( tabLayouts, activeTab ) ) {
			return;
		}

		const nextLayouts = { ...tabLayouts };
		delete nextLayouts[ activeTab ];
		void set( PREFERENCES_SCOPE, PREFERENCES_KEY, nextLayouts );
	}, [ activeTab, tabLayouts, set ] );

	return {
		layout,
		setLayout,
		resetLayout,
		hasCustomLayout: stored !== undefined,
	};
}
