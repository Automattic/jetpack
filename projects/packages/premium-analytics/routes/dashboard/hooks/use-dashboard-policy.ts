import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from 'react';
import type {
	CanPerformDashboardOperation,
	DashboardOperationRequest,
} from '@wordpress/widget-dashboard';

type DashboardOperation = DashboardOperationRequest[ 'operation' ];

/**
 * What the dashboard offers for an operation the server sent no answer for:
 * a reader's rights, with adding and removing widgets withheld.
 */
const DEFAULT_CAPABILITIES: Record< DashboardOperation, boolean > = {
	customize: true,
	insert: false,
	remove: false,
	move: true,
	resize: true,
	edit: true,
	reset: true,
};

/**
 * The application's answer to the dashboard policy seam.
 *
 * The server derives what the user may do from the role they play on the
 * dashboard; this hook only reads that answer, one flag per operation.
 *
 * @return The policy callback for `WidgetDashboard.Policy`.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation {
	return useMemo< CanPerformDashboardOperation >( () => {
		const capabilities = getScriptData()?.premium_analytics?.dashboard?.capabilities ?? {};

		return request =>
			capabilities[ request.operation ] ?? DEFAULT_CAPABILITIES[ request.operation ];
	}, [] );
}
