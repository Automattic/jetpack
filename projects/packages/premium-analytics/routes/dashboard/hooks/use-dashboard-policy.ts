import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

/**
 * The application's answer to the dashboard policy seam.
 *
 * Customization is limited to moving and resizing widgets: adding, removing
 * and resetting sit behind the dashboard composition feature flag, whose
 * answer the server puts on the script data. Attribute editing stays open:
 * it is how widgets expose their views, in and out of customize mode.
 *
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const canCompose = getScriptData()?.premium_analytics?.dashboard_composition_enabled === true;

		return request => {
			switch ( request.operation ) {
				case 'insert':
				case 'remove':
				case 'reset':
					return canCompose;
				default:
					return true;
			}
		};
	}, [] );
}
