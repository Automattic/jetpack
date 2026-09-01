/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	hasComparisonEnabled,
	needsReportDateParamsSeed,
	normalizeReportParams,
	withoutComparison,
} from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { ensureDashboardEntities } from '../dashboard-entities';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';

type DashboardSearch = Record< string, string | undefined >;

/**
 * Route lifecycle for the dashboard. The initial analytics sync is not a guard
 * — only the store section waits on it and shows progress meanwhile (see
 * `stage.tsx`). Widget-module registration is idempotent for repeat visits; it
 * could move to `packages/init` and run once at boot — tracked as a follow-up.
 */
export const route = {
	beforeLoad: async ( { search }: { search?: DashboardSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		const params = ( search ?? {} ) as DashboardSearch;
		if ( needsReportDateParamsSeed( params ) ) {
			/*
			 * Warm the core `site` record for `useSiteHomeUrl()`; a rejection should
			 * not error the page since the seed's own dates don't depend on it.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			const normalized = normalizeReportParams(
				params as Parameters< typeof normalizeReportParams >[ 0 ]
			);

			/*
			 * Overlay `normalizeReportParams` onto `params`, not replace it, so
			 * passthrough params like `section` survive the seed. Comparison keys
			 * only survive when normalize returned a complete comparison: a
			 * hand-edited bare `comp=1` must not outlive the seed.
			 */
			const merged = { ...params, ...normalized };
			const seeded: Record< string, unknown > = hasComparisonEnabled( normalized )
				? merged
				: withoutComparison( merged );

			throw redirect( {
				to: '/',
				replace: true,
				/*
				 * The router is built dynamically, so '/' has no typed search schema
				 * (TanStack widens it to `never`); cast as the routing package does.
				 */
				search: seeded as unknown as never,
			} );
		}

		ensureDashboardEntities();
	},
};
