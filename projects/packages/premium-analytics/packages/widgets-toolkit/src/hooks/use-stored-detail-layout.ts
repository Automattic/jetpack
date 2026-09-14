import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import fastDeepEqual from 'fast-deep-equal';
import { useCallback, useMemo, useState } from 'react';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

// One preference per detail route, holding every layout the page can show.
const PREFERENCES_KEY = 'layouts';

// Injected per render by the compositions (the email tabs pin their send
// window), so it is never stored and the fixed composition's copy always wins.
const INJECTED_ATTRIBUTE = 'reportParams';

type Attributes = Record< string, unknown >;

/**
 * One stored card: which fixed-composition widget it is, where the user put
 * it, and the attributes they changed. Only the keys that differ from the
 * composition are kept, so a composition that later changes a default still
 * reaches every card the reader did not touch.
 */
type StoredWidget = {
	uuid: string;
	placement?: DashboardWidget[ 'placement' ];
	attributes?: Attributes;
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
 * The attributes of a committed card that differ from its fixed composition.
 *
 * @param committed - The card as the dashboard committed it.
 * @param fixed     - The same card in the fixed composition, if still shipped.
 * @return The changed attributes, or nothing when none changed.
 */
function changedAttributes(
	committed: DashboardWidget,
	fixed: DashboardWidget | undefined
): Attributes | undefined {
	const fixedAttributes = ( fixed?.attributes ?? {} ) as Attributes;
	const changed: Attributes = {};

	for ( const [ key, value ] of Object.entries( committed.attributes ?? {} ) ) {
		if ( key !== INJECTED_ATTRIBUTE && ! fastDeepEqual( value, fixedAttributes[ key ] ) ) {
			changed[ key ] = value;
		}
	}

	return Object.keys( changed ).length ? changed : undefined;
}

/**
 * Rebuild a layout from its stored membership, placements, and attribute changes.
 *
 * Everything else — type, the composition's own attributes, and any params it
 * injects — always comes from the current fixed layout. A stored uuid the
 * composition no longer ships is dropped; a fixed card absent from the store
 * stays removed, matching how the dashboard treats its stored section layouts.
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

		return [
			{
				...fixedWidget,
				...( entry.placement ? { placement: entry.placement } : {} ),
				...( entry.attributes
					? {
							attributes: {
								...( fixedWidget.attributes as Attributes | undefined ),
								...entry.attributes,
							},
					  }
					: {} ),
			},
		];
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

	// The dashboard rebuilds its staging copy only when the committed layout
	// changes identity, so a reset with nothing stored still has to hand it one.
	const [ resetCount, setResetCount ] = useState( 0 );

	const stored = Object.hasOwn( layouts, layoutId ) ? layouts[ layoutId ] : undefined;

	const layout = useMemo( () => {
		if ( stored ) {
			return applyStoredLayout( stored, fixedLayout );
		}
		return resetCount ? [ ...fixedLayout ] : fixedLayout;
	}, [ stored, fixedLayout, resetCount ] );

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			const fixedByUuid = new Map( fixedLayout.map( widget => [ widget.uuid, widget ] ) );

			void set( scope, PREFERENCES_KEY, {
				...layouts,
				[ layoutId ]: nextLayout.map( widget => {
					const attributes = changedAttributes( widget, fixedByUuid.get( widget.uuid ) );

					return {
						uuid: widget.uuid,
						...( widget.placement ? { placement: widget.placement } : {} ),
						...( attributes ? { attributes } : {} ),
					};
				} ),
			} );
		},
		[ scope, layoutId, layouts, fixedLayout, set ]
	);

	const resetLayout = useCallback( () => {
		setResetCount( count => count + 1 );

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
