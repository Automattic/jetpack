/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from './hooks/constants';

type DashboardSearch = Record< string, string | undefined >;

/**
 * Route lifecycle for the dashboard.
 *
 * Guard:
 * - Not connected → /connect
 * - Connected but sync pending → /syncing
 *
 * Seed the default date range into the URL on first visit so the date picker
 * and the widgets share a populated search state. Defaults to the last 30 days
 * with a previous-period comparison, resolved from the shared analytics
 * defaults (`getDefaultQueryParams`).
 *
 * Then register the widget-modules discovery entity before the stage renders,
 * so the stage's `getEntityRecords` read resolves and feeds the records to
 * `useWidgetTypes`. Premium Analytics serves the records from its own namespace
 * (see `src/widget-modules.php`), independent of core's `wp/v2` endpoint.
 * Guarded for idempotency: beforeLoad re-runs on every navigation and preload.
 */
export const route = {
	beforeLoad: ( { search }: { search?: DashboardSearch } = {} ) => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing' } );
		}

		const params = ( search ?? {} ) as DashboardSearch;
		if ( ! params.from || ! params.to || ! params.interval ) {
			throw redirect( {
				to: '/',
				replace: true,
				/*
				 * The router is built dynamically, so the '/' route has no
				 * statically-typed search schema (tanstack widens it to
				 * `never`). Cast the seeded params the same way the routing
				 * package does when it writes the URL.
				 */
				search: { ...params, ...getDefaultQueryParams( true ) } as unknown as never,
			} );
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
