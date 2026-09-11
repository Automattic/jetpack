import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import type { CanPerformDashboardOperation } from '@wordpress/widget-dashboard';

/**
 * Whether the dashboard composition feature flag is on: adding and removing
 * widgets are for its holders only.
 *
 * @return The flag's answer, off when the script data carries none.
 */
export function isDashboardCompositionEnabled(): boolean {
	return getScriptData()?.premium_analytics?.dashboard_composition_enabled === true;
}

/**
 * The application's answer to the dashboard policy seam.
 *
 * Customization is limited to moving and resizing widgets, entered from the
 * page options menu rather than the dashboard's own button, which also holds
 * Reset to default: adding and removing sit behind the dashboard composition
 * feature flag, whose answer the server puts on the script data. Attribute
 * editing stays open: it is how widgets expose their views, in and out of
 * customize mode.
 *
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const canCompose = isDashboardCompositionEnabled();

		return request => {
			switch ( request.operation ) {
				case 'customize':
				case 'reset':
					return false;
				case 'insert':
				case 'remove':
					return canCompose;
				default:
					return true;
			}
		};
	}, [] );
}
