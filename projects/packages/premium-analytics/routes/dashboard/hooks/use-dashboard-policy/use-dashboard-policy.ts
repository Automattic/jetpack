import { getLockedWidgetFeature } from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';
import type { LockedSectionGate } from '@jetpack-premium-analytics/data';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

type UseDashboardPolicyParams = {
	insertableWidgetTypes: Set< string >;
	/** The active section's gate when the site's plan locks it. */
	lockedSection?: LockedSectionGate;
};

/**
 * The application's answer to the dashboard policy seam.
 *
 * Readers may move, resize, add and remove widgets, but only the insertable
 * types can be added, and the dashboard's own Reset to default is withheld.
 * A locked section only lets its open widgets be arranged.
 *
 * @param {UseDashboardPolicyParams} props - The policy inputs.
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy( {
	insertableWidgetTypes,
	lockedSection,
}: UseDashboardPolicyParams ): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >(
		() => request => {
			switch ( request.operation ) {
				case 'reset':
					return false;
				case 'customize':
					// With no open widget, the layout is empty, which `WidgetDashboard` opens Customize over.
					return ! lockedSection || lockedSection.open_widget_types.length > 0;
				case 'insert':
					// A locked section hides what is added. Locked types stay out of the inserter, but
					// keep `edit`: the frame hides header controls without it.
					return (
						! lockedSection &&
						insertableWidgetTypes.has( request.widgetType.name ) &&
						! getLockedWidgetFeature( request.widgetType.name )
					);
				case 'remove':
					// Removing the last open widget would leave an empty layout, stuck in Customize.
					return ! lockedSection;
				default:
					return true;
			}
		},
		[ insertableWidgetTypes, lockedSection ]
	);
}
