/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	getPolicyDefaultPreset,
	getStatsDatePolicy,
	needsReportDateParamsSeed,
} from '@jetpack-premium-analytics/data';
import { pickDashboardOriginParams } from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { routePathname } from '../date-window-notice';
import { seedSiteDateParams } from '../site-date-seed';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { limitStatsDateSearch, PLAN_DATE_LIMITED_SECTIONS } from '../stats-date-window';
import { getReportDefinition } from './registry';

type ReportRouteParams = { report?: string };
type ReportRouteSearch = Record< string, string | undefined >;

/**
 * Route lifecycle for the dynamic report page (`/reports/$report`).
 *
 * The `$report` path segment selects a definition from the registry; guards
 * mirror the dashboard and post-detail routes.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: ReportRouteParams; search?: ReportRouteSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		// An unknown or missing report has nothing to render under this scoped URL,
		// so redirect rather than mount unscoped chrome under a scoped header.
		const report = params?.report;
		const definition = getReportDefinition( report );
		if ( ! definition ) {
			throw redirect( { to: '/' } );
		}

		// `report` is a non-empty, matched id here — `getReportDefinition` only
		// returns a definition for one.
		const reportId = report as string;

		const currentSearch = ( search ?? {} ) as ReportRouteSearch;
		const pathname = routePathname( '/reports/$report', { report: reportId } );
		// A `section` from a link may not belong to this report (e.g. forwarded from a
		// dashboard widget); resolve it so a shareable URL never persists a bogus section.
		const resolvedSection =
			currentSearch.section && definition.resolveSection
				? definition.resolveSection( currentSearch.section )
				: undefined;
		const policy = PLAN_DATE_LIMITED_SECTIONS.includes( definition.dashboardSection )
			? getStatsDatePolicy()
			: undefined;
		const lockedIntervals = policy?.lockedIntervals;
		const needsDateSeed = needsReportDateParamsSeed( currentSearch, lockedIntervals );
		const needsSectionSeed =
			!! currentSearch.section &&
			!! definition.resolveSection &&
			resolvedSection !== currentSearch.section;

		if ( needsDateSeed || needsSectionSeed ) {
			/*
			 * Warm the core `site` record for `useSiteHomeUrl()`; a rejection shouldn't block
			 * the page and the seed's own dates don't depend on it, so fall through.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			// Allowlist the params this page owns rather than spreading `currentSearch`
			// wholesale, so foreign params a link carried in aren't persisted.
			const seeded: Record< string, unknown > = {
				...seedSiteDateParams(
					currentSearch,
					policy ? getPolicyDefaultPreset( policy ) : undefined,
					{ lockedIntervals }
				),
				...pickDashboardOriginParams( currentSearch ),
				...( resolvedSection ? { section: resolvedSection } : {} ),
			};
			// Reports are site-wide: drop the detail-page scopes `normalizeReportParams`
			// keeps, so a link carrying one can't scope a report to a post or author.
			delete seeded.post_id;
			delete seeded.author_id;

			throw redirect( {
				to: '/reports/$report',
				/*
				 * The router is built dynamically, so tanstack widens `/reports/$report`'s
				 * params/search to `never`; cast as the routing package does when writing the URL.
				 */
				params: { report: reportId } as unknown as never,
				replace: true,
				viewTransition: false,
				search: ( ( policy &&
					limitStatsDateSearch( seeded, { pathname, requested: currentSearch } ) ) ||
					seeded ) as unknown as never,
			} );
		}

		const limited = policy ? limitStatsDateSearch( currentSearch, { pathname } ) : undefined;
		if ( limited ) {
			throw redirect( {
				to: '/reports/$report',
				params: { report: reportId } as unknown as never,
				replace: true,
				viewTransition: false,
				search: limited as unknown as never,
			} );
		}
	},
};
