/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from './hooks/constants';

/**
 * Route lifecycle for the dashboard.
 *
 * Guard:
 * - Not connected → /connect
 * - Connected but sync pending → /syncing
 *
 * Then register the widget-modules discovery entity before the stage renders,
 * so the stage's `getEntityRecords` read resolves and feeds the records to
 * `useWidgetTypes`. Premium Analytics serves the records from its own namespace
 * (see `src/widget-modules.php`), independent of core's `wp/v2` endpoint.
 * Guarded for idempotency: beforeLoad re-runs on every navigation and preload.
 */
export const route = {
	beforeLoad: () => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect', viewTransition: false } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing', viewTransition: false } );
		}

		const coreSelect = select( coreStore ) as unknown as {
			getEntityConfig: ( kind: string, name: string ) => unknown;
		};
		if ( coreSelect.getEntityConfig( 'root', 'widgetModule' ) ) {
			return;
		}

		const coreDispatch = dispatch( coreStore ) as unknown as {
			addEntities: ( entities: object[] ) => void;
		};
		coreDispatch.addEntities( [
			{
				name: 'widgetModule',
				kind: 'root',
				key: 'name',
				baseURL: `/${ DASHBOARD_REST_NAMESPACE }/widget-modules`,
				plural: 'widgetModules',
				label: __( 'Widget modules', 'jetpack-premium-analytics' ),
				supportsPagination: false,
			},
		] );
	},
};
