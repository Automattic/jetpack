import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

/**
 * The application's answer to the dashboard policy seam.
 *
 * Moving and removing widgets is offered to Automatticians on sandboxed
 * requests only while the dashboard composition is under evaluation. Every
 * other operation is left to the engine.
 *
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const facts = getScriptData()?.premium_analytics;
		const canRestructure = facts?.is_automattician === true && facts?.is_sandboxed === true;

		return request => {
			switch ( request.operation ) {
				case 'move':
				case 'remove':
					return canRestructure;
				default:
					return true;
			}
		};
	}, [] );
}
