/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	needsReportDateParamsSeed,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { ensureDashboardEntities } from '../dashboard-entities';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';

type DashboardSearch = Record< string, string | undefined >;

/**
 * Route lifecycle for the dashboard.
 *
 * Guard:
 * - Not connected → /connect
 *
 * The initial analytics sync is not a guard: only the store section's data waits
 * on it, so that section shows sync progress while the rest of the dashboard
 * renders (see `stage.tsx`).
 *
 * Seed the default date range into the URL on first visit so the date picker
 * and the widgets share a populated search state. Defaults to the last 30 days
 * with a previous-period comparison, resolved from the shared analytics
 * defaults (`getDefaultQueryParams`). Also re-seeds when `interval` is missing
 * or not allowed for the active range. The seed itself needs nothing async —
 * the site timezone comes from the WordPress date settings that ship with the
 * page — but it still awaits `ensureCoreSettingsReady()` to warm the core
 * `site` record that `useSiteHomeUrl()` reads once the stage renders.
 *
 * Then register the widget-modules discovery entity before the stage renders,
 * so the stage's `getEntityRecords` read resolves and feeds the records to
 * `useWidgetTypes`. Premium Analytics serves the records from its own namespace
 * (see `src/widget-modules.php`), independent of core's `wp/v2` endpoint.
 * The route is registered under `wpcom/v2` so WPCOM can expose it through the
 * site-scoped public-api path for Simple sites.
 * Registration is idempotent per entity (see `ensureDashboardEntities`):
 * beforeLoad re-runs on every navigation and preload, and a detail route may
 * already have registered `widgetModule` alone before the user reaches the
 * dashboard.
 *
 * That registration is one-time bootstrap setup that could move to the page's
 * `init` module (`packages/init`) now that `@wordpress/build` supports it —
 * registering once at boot instead of on every beforeLoad run. Left here for
 * now (idempotency-guarded); tracked as a follow-up.
 */
export const route = {
	beforeLoad: async ( { search }: { search?: DashboardSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		const params = ( search ?? {} ) as DashboardSearch;
		if ( needsReportDateParamsSeed( params ) ) {
			/*
			 * Warm the core `site` record before the stage renders, so
			 * `useSiteHomeUrl()` has it. A rejection here (network/auth)
			 * shouldn't error the whole page, so fall through to the seed —
			 * matching upstream's loader behavior. The seed's own dates do not
			 * depend on this; they resolve from the WordPress date settings.
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

		ensureDashboardEntities();
	},
};
