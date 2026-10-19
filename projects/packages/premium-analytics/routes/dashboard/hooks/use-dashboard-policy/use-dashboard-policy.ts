import { getLockedWidgetFeature } from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

type UseDashboardPolicyParams = {
	insertableWidgetTypes: Set< string >;
};

/**
 * The application's answer to the dashboard policy seam.
 *
 * Readers may move, resize, add and remove widgets, but only the insertable
 * types can be added, and the dashboard's own Reset to default is withheld.
 *
 * @param {UseDashboardPolicyParams} props - The policy inputs.
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy( {
	insertableWidgetTypes,
}: UseDashboardPolicyParams ): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >(
		() => request => {
			switch ( request.operation ) {
				case 'reset':
					return false;
				case 'insert':
					// Locked types stay out of the inserter, but keep `edit`: the frame hides header controls without it.
					return (
						insertableWidgetTypes.has( request.widgetType.name ) &&
						! getLockedWidgetFeature( request.widgetType.name )
					);
				default:
					return true;
			}
		},
		[ insertableWidgetTypes ]
	);
}
