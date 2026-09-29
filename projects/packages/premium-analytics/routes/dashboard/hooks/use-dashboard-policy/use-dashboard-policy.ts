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

type UseDashboardPolicyParams = {
	insertableWidgetTypes: Set< string >;
};

/**
 * The application's answer to the dashboard policy seam.
 *
 * Customization is limited to moving and resizing widgets: adding and removing
 * sit behind the dashboard composition feature flag, whose answer the server
 * puts on the script data. Attribute editing stays open: it is how widgets
 * expose their views, in and out of customize mode. `reset` is denied so the
 * toolkit's Reset to default button stands in for the dashboard's overflow
 * entry, dialog and command.
 *
 * `insert` allows only the widget types it is handed. For now those are the
 * types the active section instantiates in its default layout, a criterion
 * expected to change.
 *
 * @param {UseDashboardPolicyParams} props                       - The policy inputs.
 * @param {Set< string >}            props.insertableWidgetTypes - Names of the widget types `insert` allows.
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy( {
	insertableWidgetTypes,
}: UseDashboardPolicyParams ): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const canCompose = isDashboardCompositionEnabled();

		return request => {
			switch ( request.operation ) {
				case 'reset':
					return false;
				case 'insert':
					return canCompose && insertableWidgetTypes.has( request.widgetType.name );
				case 'remove':
					return canCompose;
				default:
					return true;
			}
		};
	}, [ insertableWidgetTypes ] );
}
