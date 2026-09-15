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
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
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
		// A `section` from a link may not belong to this report (e.g. forwarded from a
		// dashboard widget); resolve it so a shareable URL never persists a bogus section.
		const resolvedSection =
			currentSearch.section && definition.resolveSection
				? definition.resolveSection( currentSearch.section )
				: undefined;
		const needsDateSeed = needsReportDateParamsSeed( currentSearch );
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
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				...( resolvedSection ? { section: resolvedSection } : {} ),
			};
			// Reports are site-wide: drop the `post_id` `normalizeReportParams` keeps
			// for post-detail, so a link carrying one can't scope a report to a post.
			delete seeded.post_id;

			throw redirect( {
				to: '/reports/$report',
				/*
				 * The router is built dynamically, so tanstack widens `/reports/$report`'s
				 * params/search to `never`; cast as the routing package does when writing the URL.
				 */
				params: { report: reportId } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}
	},
};
