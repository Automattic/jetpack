import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

/**
 * The application's answer to the dashboard policy seam.
 *
 * Customization is limited to moving and resizing widgets: adding, removing
 * and resetting are offered to Automatticians on sandboxed requests only while
 * the dashboard composition is under evaluation. Attribute editing stays open:
 * it is how widgets expose their views, in and out of customize mode.
 *
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const facts = getScriptData()?.premium_analytics;
		const canRecompose = facts?.is_automattician === true && facts?.is_sandboxed === true;

		return request => {
			switch ( request.operation ) {
				case 'insert':
				case 'remove':
				case 'reset':
					return canRecompose;
				default:
					return true;
			}
		};
	}, [] );
}
