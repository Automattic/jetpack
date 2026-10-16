/**
 * External dependencies
 */
import { getLockedSection } from '@jetpack-premium-analytics/data';
import { useCallback, useMemo } from 'react';
import type { LockedSectionGate } from '@jetpack-premium-analytics/data';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Put the hidden widgets back around a layout the dashboard saved, each at its old index.
 *
 * @param full        - The stored layout, hidden widgets included.
 * @param nextVisible - The layout the dashboard saved.
 * @param isHidden    - Whether a stored widget was kept from the dashboard.
 * @return The layout to store.
 */
export function restoreHiddenWidgets(
	full: DashboardWidget[],
	nextVisible: DashboardWidget[],
	isHidden: ( widget: DashboardWidget ) => boolean
): DashboardWidget[] {
	const saved = new Map( nextVisible.map( widget => [ widget.uuid, widget ] ) );
	const known = new Set( full.map( widget => widget.uuid ) );
	const restored: DashboardWidget[] = [];

	for ( const widget of full ) {
		const next = saved.get( widget.uuid );
		if ( next ) {
			restored.push( next );
		} else if ( isHidden( widget ) ) {
			restored.push( widget );
		}
	}

	return [ ...restored, ...nextVisible.filter( widget => ! known.has( widget.uuid ) ) ];
}

/**
 * The layout a section shows once its plan locks it: only open widgets, saved without losing the rest.
 *
 * @param section        - The section slug.
 * @param layout         - The section's stored layout.
 * @param onLayoutChange - Stores a layout.
 * @return The section's gate, the layout to show and the save handler for it.
 */
export function useLockedSectionLayout(
	section: string,
	layout: DashboardWidget[],
	onLayoutChange: ( next: DashboardWidget[] ) => void
): {
	lockedSection: LockedSectionGate | undefined;
	visibleLayout: DashboardWidget[];
	onVisibleLayoutChange: ( next: DashboardWidget[] ) => void;
} {
	const lockedSection = getLockedSection( section );
	const isHidden = useCallback(
		( widget: DashboardWidget ) => ! lockedSection?.open_widget_types.includes( widget.type ),
		[ lockedSection ]
	);

	const visibleLayout = useMemo(
		() => ( lockedSection ? layout.filter( widget => ! isHidden( widget ) ) : layout ),
		[ lockedSection, layout, isHidden ]
	);

	// An inline attribute edit autosaves the layout the dashboard holds, which lacks the hidden widgets.
	const onVisibleLayoutChange = useCallback(
		( next: DashboardWidget[] ) =>
			onLayoutChange( lockedSection ? restoreHiddenWidgets( layout, next, isHidden ) : next ),
		[ lockedSection, layout, onLayoutChange, isHidden ]
	);

	return { lockedSection, visibleLayout, onVisibleLayoutChange };
}
