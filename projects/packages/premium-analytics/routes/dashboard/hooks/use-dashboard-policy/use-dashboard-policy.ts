import { getLockedWidgetFeature } from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation, DashboardWidget } from '@wordpress/widget-dashboard';

type UseDashboardPolicyParams = {
	insertableWidgetTypes: Set< string >;
	/** The widgets a plan-locked section still shows; undefined when the section is open. */
	lockedLayout?: DashboardWidget[];
	/** Whether the section shows the connect prompt instead of its widgets. */
	needsConnection?: boolean;
};

/**
 * The application's answer to the dashboard policy seam.
 *
 * Readers may move, resize, add and remove widgets, but only the insertable
 * types can be added, and the dashboard's own Reset to default is withheld.
 * A locked section only lets its open widgets be arranged, and one that needs the connection none.
 *
 * @param {UseDashboardPolicyParams} props - The policy inputs.
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy( {
	insertableWidgetTypes,
	lockedLayout,
	needsConnection = false,
}: UseDashboardPolicyParams ): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >(
		() => request => {
			// Nothing renders over the connect prompt, so a widget added there would be saved unseen.
			if ( needsConnection && [ 'customize', 'insert', 'remove' ].includes( request.operation ) ) {
				return false;
			}
			switch ( request.operation ) {
				case 'reset':
					return false;
				case 'customize':
					// `WidgetDashboard` opens Customize over an empty layout, which a locked one cannot fill.
					return ! lockedLayout || lockedLayout.length > 0;
				case 'insert':
					// A locked section would hide anything added. Locked types stay out of the inserter,
					// but keep `edit`: the frame hides header controls without it.
					return (
						! lockedLayout &&
						insertableWidgetTypes.has( request.widgetType.name ) &&
						! getLockedWidgetFeature( request.widgetType.name )
					);
				case 'remove':
					// Insert is denied too, so a removed open widget would only come back by a reset.
					return ! lockedLayout;
				default:
					return true;
			}
		},
		[ insertableWidgetTypes, lockedLayout, needsConnection ]
	);
}
