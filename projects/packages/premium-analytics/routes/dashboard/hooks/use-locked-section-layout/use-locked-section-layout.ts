/**
 * External dependencies
 */
import { getLockedSection } from '@jetpack-premium-analytics/data';
import { useCallback, useMemo } from 'react';
import type { LockedSectionGate } from '@jetpack-premium-analytics/data';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

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

	const visibleLayout = useMemo(
		() =>
			lockedSection
				? layout.filter( widget => lockedSection.open_widget_types.includes( widget.type ) )
				: layout,
		[ lockedSection, layout ]
	);

	// The policy denies insert and remove on a locked section, so a save carries the same widgets,
	// which the stored layout takes over by uuid.
	const onVisibleLayoutChange = useCallback(
		( next: DashboardWidget[] ) => {
			if ( ! lockedSection ) {
				onLayoutChange( next );
				return;
			}
			const saved = new Map( next.map( widget => [ widget.uuid, widget ] ) );
			onLayoutChange( layout.map( widget => saved.get( widget.uuid ) ?? widget ) );
		},
		[ lockedSection, layout, onLayoutChange ]
	);

	return { lockedSection, visibleLayout, onVisibleLayoutChange };
}
