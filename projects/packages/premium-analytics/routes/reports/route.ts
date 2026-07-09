/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { ensureCoreSettingsReady, normalizeReportParams } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getReportDefinition } from './registry';

type ReportRouteParams = { report?: string };
type ReportRouteSearch = Record< string, string | undefined >;

/**
 * Route lifecycle for the dynamic report page (`/reports/$report`).
 *
 * One route serves every report: the `$report` path segment selects a report
 * definition from the registry, and the stage renders that report's page
 * component. Guards mirror the dashboard and post-detail routes:
 *
 * - Not connected → /connect
 * - Connected but sync pending → /syncing
 * - Unknown or missing `$report` → / (dashboard)
 *
 * The unknown-report guard uses the same reasoning as post-detail's invalid
 * `postId` guard: a `/reports/<unknown>` URL has no report to render, and
 * letting it through would mount an ambiguous page under a scoped URL. Send it
 * back to the dashboard rather than render unscoped chrome.
 *
 * On first visit it seeds the shared report-window params into the URL (so the
 * date picker and the report's widgets share a populated state) and resolves an
 * incoming `?section=` through the report's own `resolveSection` when the report
 * defines one, so a shareable URL never persists a section the report can't
 * render.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: ReportRouteParams; search?: ReportRouteSearch } = {} ) => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing' } );
		}

		// Validate the path param against the registry. An unknown or missing
		// report has nothing to render under this scoped URL, so send it back to
		// the dashboard (same rationale as post-detail's invalid-postId guard).
		const report = params?.report;
		const definition = getReportDefinition( report );
		if ( ! definition ) {
			throw redirect( { to: '/' } );
		}

		// `report` is a non-empty, matched id here — `getReportDefinition` only
		// returns a definition for one.
		const reportId = report as string;

		const currentSearch = ( search ?? {} ) as ReportRouteSearch;
		// A `section` carried in from a link may not be one this report owns
		// (e.g. a dashboard section forwarded by a widget link); resolve it
		// through the report's own resolver so a shareable URL never persists a
		// bogus section. Reports without sections omit `resolveSection`, in which
		// case there is nothing to resolve or seed.
		const resolvedSection =
			currentSearch.section && definition.resolveSection
				? definition.resolveSection( currentSearch.section )
				: undefined;
		const needsDateSeed = ! currentSearch.from || ! currentSearch.to || ! currentSearch.interval;
		const needsSectionSeed =
			!! currentSearch.section &&
			!! definition.resolveSection &&
			resolvedSection !== currentSearch.section;

		if ( needsDateSeed || needsSectionSeed ) {
			/*
			 * Seed dates in the site timezone, not the browser's, by waiting for
			 * core `site` settings. A rejection here shouldn't error the whole
			 * page, so fall back to the default seed.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			// Allowlist the params this page owns rather than spreading
			// `currentSearch` wholesale: `normalizeReportParams` yields only the
			// known report-window params, and the resolved section is the only
			// report-scoped param seeded here. This contains any foreign params a
			// link carried in instead of persisting them.
			const seeded: Record< string, unknown > = {
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				...( resolvedSection ? { section: resolvedSection } : {} ),
			};
			// `normalizeReportParams` preserves a valid `post_id` for the
			// post-detail surface, but reports are site-wide — drop it so a link
			// carrying one can't scope a report to a single post.
			delete seeded.post_id;

			throw redirect( {
				to: '/reports/$report',
				/*
				 * The router is built dynamically, so `/reports/$report` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`). Cast the same way the routing package does when it
				 * writes the URL.
				 */
				params: { report: reportId } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}
	},
};
