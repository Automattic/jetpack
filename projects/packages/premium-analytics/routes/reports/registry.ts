/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import { isDashboardSectionAvailable } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { isVideoPressAvailable } from '../site-readiness';
// Import from `config/tabs` directly, not the `config` barrel — it re-exports JSX,
// and `route.ts` imports this registry in `beforeLoad`, which must stay React-free.
import { resolveTabId as resolveCommentsTabId } from './comments/config/tabs';
import { resolveSection as resolveEarningsSection } from './earnings/config/tabs';
import { resolveSection as resolveLocationsSection } from './locations/config/tabs';
import { resolveSection as resolveUtmSection } from './utm/config/tabs';
import type { ReportPageRecord } from '../single-report/registry';
import type { DashboardSectionSlug, StatsFeatureKey } from '@jetpack-premium-analytics/data';

/**
 * A single report's registration in the report registry.
 *
 * Labels are getters rather than plain strings so translations apply after the
 * i18n locale data has loaded.
 */
export type ReportDefinition = {
	/**
	 * Stable, URL-friendly identifier. Matches the `$report` path segment
	 * (e.g. `/reports/posts`) and keys the component in the stage.
	 */
	id: string;

	/**
	 * Dashboard tab the report belongs to. Unrelated to `resolveSection`, which names
	 * a tab *inside* the report.
	 */
	dashboardSection: DashboardSectionSlug;

	/**
	 * The report's name: its trailing crumb, the crumb back to it from a detail
	 * page, and the heading over its records on an untabbed report. `All pages`.
	 */
	getLabel: () => string;

	/**
	 * Resolve a raw `?section=` value to a section this report owns, falling back
	 * to its default, so a shareable URL never persists a section the report can't
	 * render. Omit for reports that have no sections.
	 */
	resolveSection?: ( value: string | undefined ) => string;

	/**
	 * Whether the report is available on this site, resolved at lookup time.
	 * An unavailable report is treated like an unknown one — the route guard
	 * redirects it to the dashboard. Omit for reports available everywhere.
	 */
	isAvailable?: () => boolean;

	/**
	 * The paid Stats feature the report shows; a plan without it gets the locked page. Omit for
	 * reports every plan includes.
	 */
	feature?: StatsFeatureKey;
};

/**
 * The report registry: one entry per report, keyed by its `id`.
 *
 * To add a report, drop a `<id>/` folder under `routes/reports/` that
 * default-exports its page component, add an entry here and its component to
 * `report-pages.ts`; no new route needed.
 */
export const REPORTS: Record< string, ReportDefinition > = {
	'annual-insights': {
		id: 'annual-insights',
		feature: 'insights',
		dashboardSection: 'insights',
		getLabel: () => __( 'Annual insights', 'jetpack-premium-analytics-pkg' ),
	},
	authors: {
		id: 'authors',
		feature: 'authors',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Top authors', 'jetpack-premium-analytics-pkg' ),
	},
	'comment-followers': {
		id: 'comment-followers',
		dashboardSection: 'subscribers',
		getLabel: () => __( 'Comments Subscribers', 'jetpack-premium-analytics-pkg' ),
	},
	clicks: {
		id: 'clicks',
		feature: 'clicks',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
	},
	comments: {
		id: 'comments',
		feature: 'insights',
		dashboardSection: 'insights',
		getLabel: () => __( 'All comments', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveCommentsTabId,
	},
	downloads: {
		id: 'downloads',
		feature: 'file-downloads',
		dashboardSection: 'traffic',
		getLabel: () => __( 'File downloads', 'jetpack-premium-analytics-pkg' ),
		// Download tracking is WPCOM-only, so Calypso shows the module on Simple
		// sites only; mirrors the gate in `src/widget-type-support.php`.
		isAvailable: isSimpleSite,
	},
	earnings: {
		id: 'earnings',
		dashboardSection: 'ads',
		getLabel: () => __( 'Earnings history', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveEarningsSection,
	},
	emails: {
		id: 'emails',
		dashboardSection: 'subscribers',
		getLabel: () => __( 'Emails', 'jetpack-premium-analytics-pkg' ),
	},
	locations: {
		id: 'locations',
		feature: 'countries',
		dashboardSection: 'traffic',
		getLabel: () => __( 'All locations', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveLocationsSection,
	},
	'search-terms': {
		id: 'search-terms',
		feature: 'search-terms',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Search terms', 'jetpack-premium-analytics-pkg' ),
	},
	tags: {
		id: 'tags',
		feature: 'tags',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Tags & categories', 'jetpack-premium-analytics-pkg' ),
	},
	videos: {
		id: 'videos',
		feature: 'videos',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Videos', 'jetpack-premium-analytics-pkg' ),
		// Play counts only exist for VideoPress-hosted videos; mirrors the gate in
		// `src/widget-type-support.php`.
		isAvailable: isVideoPressAvailable,
	},
	utm: {
		id: 'utm',
		feature: 'utm',
		dashboardSection: 'traffic',
		getLabel: () => __( 'All UTM values', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveUtmSection,
	},
	referrers: {
		id: 'referrers',
		feature: 'referrers',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Referrers', 'jetpack-premium-analytics-pkg' ),
	},
};

/**
 * The reports page the server registered under a path, as it publishes it in
 * `premium_analytics.reports_pages`: a report page of widgets, without an entity scope.
 *
 * @param id - The `$report` path segment.
 * @return The page record, or undefined when no registered page uses the path.
 */
export function getReportsPage( id: string | undefined ): ReportPageRecord | undefined {
	const pages = getScriptData()?.premium_analytics?.reports_pages;
	if ( ! id || ! Array.isArray( pages ) ) {
		return undefined;
	}

	// The script data type keeps the layout loose; the server serializes `DashboardWidget` instances.
	return pages.find( candidate => candidate.path === id ) as unknown as
		ReportPageRecord | undefined;
}

/**
 * The definition of a registered reports page: what the guards and the crumbs read of it.
 *
 * @param page - The page record.
 * @return The definition.
 */
function toReportDefinition( page: ReportPageRecord ): ReportDefinition {
	const { sections } = page;

	return {
		id: page.path,
		dashboardSection: page.dashboard_section as DashboardSectionSlug,
		getLabel: () => page.label,
		...( sections.length
			? {
					resolveSection: value =>
						( sections.find( section => section.slug === value ) ?? sections[ 0 ] ).slug,
				}
			: {} ),
		...( page.feature ? { feature: page.feature as StatsFeatureKey } : {} ),
	};
}

/**
 * Look up a report definition by its id: a registered reports page first, then the bundled map.
 *
 * The id comes from the URL, so this is an own-property check: a plain index
 * would resolve an inherited name such as `constructor` to a function.
 *
 * @param id - The `$report` path segment (may be missing on a malformed URL).
 * @return The matching definition, or `undefined` when the id is missing, unknown, or in a
 * section the dashboard does not expose.
 */
export function getReportDefinition( id: string | undefined ): ReportDefinition | undefined {
	const page = getReportsPage( id );
	const bundled = id && Object.hasOwn( REPORTS, id ) ? REPORTS[ id ] : undefined;
	const definition = page ? toReportDefinition( page ) : bundled;

	if ( definition?.isAvailable && ! definition.isAvailable() ) {
		return undefined;
	}

	if ( definition && ! isDashboardSectionAvailable( definition.dashboardSection ) ) {
		return undefined;
	}

	return definition;
}

/**
 * Resolve the report origin behind a detail breadcrumb.
 *
 * A section is kept only when it round-trips through the referring report's own
 * resolver, so a section from a different report is never linked.
 *
 * @param origin - The report origin read from the current search params.
 * @return The referring report definition and its validated section, when valid.
 */
export function resolveReportOrigin( origin: { report: string; section?: string } | undefined ): {
	definition?: ReportDefinition;
	section?: string;
} {
	const definition = getReportDefinition( origin?.report );
	const rawSection = origin?.section;
	const section =
		rawSection && definition?.resolveSection?.( rawSection ) === rawSection
			? rawSection
			: undefined;

	return { definition, section };
}
