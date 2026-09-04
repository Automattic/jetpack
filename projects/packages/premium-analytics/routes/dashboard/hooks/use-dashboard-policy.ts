import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

/**
 * The application's answer to the dashboard policy seam.
 *
 * Adding and removing widgets is offered to Automatticians only while the
 * dashboard composition is under evaluation. Every other operation is left to
 * the engine.
 *
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const canManageWidgets = getScriptData()?.premium_analytics?.is_automattician === true;

		return request => {
			switch ( request.operation ) {
				case 'insert':
				case 'remove':
					return canManageWidgets;
				default:
					return true;
			}
		};
	}, [] );
}
