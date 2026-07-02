/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { ensureCoreSettingsReady, normalizeReportParams } from '@jetpack-premium-analytics/data';
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
 * defaults (`getDefaultQueryParams`). The seed runs after
 * `ensureCoreSettingsReady()` so the dates are encoded in the site timezone;
 * otherwise `getDefaultQueryParams` would fall back to the browser timezone
 * (core `site` settings not loaded yet) and the seeded `to` boundary would
 * land on a different instant than a later Apply writes.
 *
 * Then register the widget-modules discovery entity before the stage renders,
 * so the stage's `getEntityRecords` read resolves and feeds the records to
 * `useWidgetTypes`. Premium Analytics serves the records from its own namespace
 * (see `src/widget-modules.php`), independent of core's `wp/v2` endpoint.
 * Guarded for idempotency: beforeLoad re-runs on every navigation and preload.
 *
 * That registration is one-time bootstrap setup that could move to the page's
 * `init` module (`packages/init`) now that `@wordpress/build` supports it —
 * registering once at boot instead of on every beforeLoad run. Left here for
 * now (idempotency-guarded); tracked as a follow-up.
 */
export const route = {
	beforeLoad: async ( { search }: { search?: DashboardSearch } = {} ) => {
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
			/*
			 * Seed dates in the site timezone, not the browser's, by waiting for
			 * core `site` settings. A rejection here (network/auth) shouldn't
			 * error the whole page, so fall back to the default seed — matching
			 * upstream's loader behavior. The only cost is the timezone briefly
			 * falling back to the browser's until settings resolve.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			/*
			 * Resolve the date params through `normalizeReportParams` — the same
			 * resolver the widgets use — so the URL and the widgets agree on
			 * dates, interval, preset, and comparison. A raw default spread would
			 * force `comp: '1'` onto a custom `from`/`to` deep-link the user never
			 * asked to compare; normalizeReportParams only applies the default
			 * comparison on a genuinely fresh load (no `from`/`to`).
			 *
			 * Overlay the resolved report params onto the original search so
			 * non-report params that may be deep-linked (e.g. `section`) survive
			 * the seed redirect.
			 */
			const seeded: Record< string, unknown > = {
				...params,
				...normalizeReportParams( params as Parameters< typeof normalizeReportParams >[ 0 ] ),
			};

			throw redirect( {
				to: '/',
				replace: true,
				/*
				 * The router is built dynamically, so the '/' route has no
				 * statically-typed search schema (tanstack widens it to
				 * `never`). Cast the seeded params the same way the routing
				 * package does when it writes the URL.
				 */
				search: seeded as unknown as never,
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
