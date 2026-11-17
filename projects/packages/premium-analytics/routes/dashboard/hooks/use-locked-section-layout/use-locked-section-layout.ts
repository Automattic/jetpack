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
 * @return The section's gate, the layout to show, its save handler, and which widgets it hides.
 */
export function useLockedSectionLayout(
	section: string,
	layout: DashboardWidget[],
	onLayoutChange: ( next: DashboardWidget[] ) => void
): {
	lockedSection: LockedSectionGate | undefined;
	visibleLayout: DashboardWidget[];
	onVisibleLayoutChange: ( next: DashboardWidget[] ) => void;
	isHiddenWidget: ( ( widget: DashboardWidget ) => boolean ) | undefined;
} {
	const lockedSection = getLockedSection( section );

	const isHiddenWidget = useMemo(
		() =>
			lockedSection
				? ( widget: DashboardWidget ) => ! lockedSection.open_widget_types.includes( widget.type )
				: undefined,
		[ lockedSection ]
	);

	const visibleLayout = useMemo(
		() => ( isHiddenWidget ? layout.filter( widget => ! isHiddenWidget( widget ) ) : layout ),
		[ isHiddenWidget, layout ]
	);

	// The policy denies insert and remove on a locked section, so a save carries the same widgets,
	// which refill the open widgets' stored slots in their new order.
	const onVisibleLayoutChange = useCallback(
		( next: DashboardWidget[] ) => {
			if ( ! isHiddenWidget ) {
				onLayoutChange( next );
				return;
			}
			const saved = [ ...next ];
			onLayoutChange(
				layout.map( widget => ( isHiddenWidget( widget ) ? widget : ( saved.shift() ?? widget ) ) )
			);
		},
		[ isHiddenWidget, layout, onLayoutChange ]
	);

	return { lockedSection, visibleLayout, onVisibleLayoutChange, isHiddenWidget };
}
