/**
 * External dependencies
 */
import {
	getSectionDatePolicy,
	isStatsFeatureLocked,
	OPEN_DATE_POLICY,
} from '@jetpack-premium-analytics/data';
import {
	DASHBOARD_ORIGIN_PARAM,
	pickDashboardOriginParams,
} from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { dateWindowRedirect } from '../date-window-redirect';
import { seedSiteDateParams } from '../site-date-seed';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { withoutCarriedYearWindow } from '../stats-date-window';
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

		// A locked report shows only its upsell, so it has no window to limit.
		const policy =
			definition.feature && isStatsFeatureLocked( definition.feature )
				? OPEN_DATE_POLICY
				: getSectionDatePolicy( definition.dashboardSection );
		// A report's own menu can link to All time, so only a link from Insights carries one over.
		const currentSearch = (
			search?.[ DASHBOARD_ORIGIN_PARAM ] === 'insights'
				? withoutCarriedYearWindow( search, policy )
				: { ...search }
		) as ReportRouteSearch;
		// A `section` from a link may not belong to this report (e.g. forwarded from a
		// dashboard widget); resolve it so a shareable URL never persists a bogus section.
		const resolvedSection =
			currentSearch.section && definition.resolveSection
				? definition.resolveSection( currentSearch.section )
				: undefined;
		const needsSectionSeed =
			!! currentSearch.section &&
			!! definition.resolveSection &&
			resolvedSection !== currentSearch.section;

		const limited = await dateWindowRedirect( currentSearch, policy, {
			seed: () => {
				// Allowlist the params this page owns rather than spreading `currentSearch`
				// wholesale, so foreign params a link carried in aren't persisted.
				const seeded: Record< string, unknown > = {
					...seedSiteDateParams( currentSearch, policy ),
					...pickDashboardOriginParams( currentSearch ),
					...( resolvedSection ? { section: resolvedSection } : {} ),
				};
				// Reports are site-wide: drop the detail-page scopes `normalizeReportParams`
				// keeps, so a link carrying one can't scope a report to a post or author.
				delete seeded.post_id;
				delete seeded.author_id;
				return seeded;
			},
			needsSeed: needsSectionSeed,
			requested: currentSearch,
		} );
		if ( limited ) {
			throw redirect( {
				to: '/reports/$report',
				/*
				 * The router is built dynamically, so tanstack widens `/reports/$report`'s
				 * params/search to `never`; cast as the routing package does when writing the URL.
				 */
				params: { report: reportId } as unknown as never,
				replace: true,
				viewTransition: false,
				search: limited.search as unknown as never,
				state: limited.state,
			} );
		}
	},
};
