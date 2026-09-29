import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import { getInsertableWidgetTypeNames } from '../../config';
import type { DashboardSection } from '../../config';
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
 * Customization is limited to moving and resizing widgets: adding and removing
 * sit behind the dashboard composition feature flag, whose answer the server
 * puts on the script data. The inserter offers the types the sections place
 * by default; any other type stays where it is placed, and can be removed.
 * Attribute editing stays open: it is how widgets expose their views, in and
 * out of customize mode. `reset` is denied so the toolkit's Reset to default
 * button stands in for the dashboard's overflow entry, dialog and command.
 *
 * @param sections - The available sections.
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy( sections: DashboardSection[] ): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const canCompose = isDashboardCompositionEnabled();
		const insertableTypeNames = getInsertableWidgetTypeNames( sections );

		return request => {
			switch ( request.operation ) {
				case 'reset':
					return false;
				case 'insert':
					return canCompose && insertableTypeNames.has( request.widgetType.name );
				case 'remove':
					return canCompose;
				default:
					return true;
			}
		};
	}, [ sections ] );
}
