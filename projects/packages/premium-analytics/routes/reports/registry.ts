/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { isDashboardSectionInPreviewScope, isVideoPressAvailable } from '../site-readiness';
// Import from `config/tabs` directly, not the `config` barrel — it re-exports JSX,
// and `route.ts` imports this registry in `beforeLoad`, which must stay React-free.
import { resolveTabId as resolveCommentsTabId } from './comments/config/tabs';
import { resolveSection as resolveLocationsSection } from './locations/config/tabs';
import { resolveTabId } from './posts/config/tabs';
import { resolveSection as resolveUtmSection } from './utm/config/tabs';
import type { ComponentType } from 'react';

/**
 * URL-facing slugs of the dashboard tabs, mirroring the section ids in
 * `src/dashboard-layout.php`.
 */
type DashboardSectionSlug = 'traffic' | 'insights' | 'subscribers' | 'store' | 'ads';

/**
 * A single report's registration in the report registry.
 *
 * Labels are getters rather than plain strings so translations apply after the
 * i18n locale data has loaded.
 */
export type ReportDefinition = {
	/**
	 * Stable, URL-friendly identifier. Matches the `$report` path segment
	 * (e.g. `/reports/posts`) and keys the lazy component in the stage.
	 */
	id: string;

	/**
	 * Dashboard tab the report belongs to. A report whose tab the preview hides is
	 * treated like an unknown one. Unrelated to `resolveSection`, which names a tab
	 * inside* the report.
	 */
	dashboardSection: DashboardSectionSlug;

	/**
	 * What the report is called from outside itself: its own trailing crumb,
	 * and the crumb linking back to it from a detail page. `All pages`.
	 */
	getLabel: () => string;

	/**
	 * Heading for the report's records: `Referrers report`. Unused on a tabbed
	 * report, which heads each section from its tab.
	 */
	getTitle: () => string;

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
	 * Dynamic import of the report's page component (default export). Kept as a
	 * thunk so React/UI is only pulled in when the report actually renders, and
	 * so this module stays importable from `route.ts` guards.
	 */
	load: () => Promise< { default: ComponentType } >;
};

/**
 * The report registry: one entry per report, keyed by its `id`.
 *
 * To add a report, drop a `<id>/` folder under `routes/reports/` that
 * default-exports its page component and add an entry here; no new route needed.
 */
export const REPORTS: Record< string, ReportDefinition > = {
	'annual-insights': {
		id: 'annual-insights',
		dashboardSection: 'insights',
		getLabel: () => __( 'Annual insights', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Annual insights report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './annual-insights/page' ),
	},
	authors: {
		id: 'authors',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Top authors', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Top authors report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './authors/page' ),
	},
	'comment-followers': {
		id: 'comment-followers',
		dashboardSection: 'subscribers',
		getLabel: () => __( 'Comments Subscribers', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Comments Subscribers report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './comment-followers/page' ),
	},
	clicks: {
		id: 'clicks',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Clicks report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './clicks/page' ),
	},
	comments: {
		id: 'comments',
		dashboardSection: 'insights',
		getLabel: () => __( 'All comments', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All comments report', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveCommentsTabId,
		load: () => import( './comments/page' ),
	},
	downloads: {
		id: 'downloads',
		dashboardSection: 'traffic',
		getLabel: () => __( 'File downloads', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'File downloads report', 'jetpack-premium-analytics-pkg' ),
		// Download tracking is WPCOM-only, so Calypso shows the module on Simple
		// sites only; mirrors the gate in `src/widget-type-support.php`.
		isAvailable: isSimpleSite,
		load: () => import( './downloads/page' ),
	},
	emails: {
		id: 'emails',
		dashboardSection: 'subscribers',
		getLabel: () => __( 'Emails', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Emails report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './emails/page' ),
	},
	locations: {
		id: 'locations',
		dashboardSection: 'traffic',
		getLabel: () => __( 'All locations', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All locations report', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveLocationsSection,
		load: () => import( './locations/page' ),
	},
	posts: {
		id: 'posts',
		dashboardSection: 'traffic',
		getLabel: () => __( 'All pages', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All pages report', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveTabId,
		load: () => import( './posts/page' ),
	},
	'search-terms': {
		id: 'search-terms',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Search terms', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Search terms report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './search-terms/page' ),
	},
	tags: {
		id: 'tags',
		dashboardSection: 'insights',
		getLabel: () => __( 'Tags & categories', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Tags & categories report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './tags/page' ),
	},
	videos: {
		id: 'videos',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Videos', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Videos report', 'jetpack-premium-analytics-pkg' ),
		// Play counts only exist for VideoPress-hosted videos; mirrors the gate in
		// `src/widget-type-support.php`.
		isAvailable: isVideoPressAvailable,
		load: () => import( './videos/page' ),
	},
	utm: {
		id: 'utm',
		dashboardSection: 'traffic',
		getLabel: () => __( 'All UTM values', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All UTM values report', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveUtmSection,
		load: () => import( './utm/page' ),
	},
	referrers: {
		id: 'referrers',
		dashboardSection: 'traffic',
		getLabel: () => __( 'Referrers', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Referrers report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './referrers/page' ),
	},
};

/**
 * Look up a report definition by its id.
 *
 * The id comes from the URL, so this is an own-property check: a plain index
 * would resolve an inherited name such as `constructor` to a function.
 *
 * @param id - The `$report` path segment (may be missing on a malformed URL).
 * @return The matching definition, or `undefined` when the id is missing, unknown, or in a
 * section the preview hides.
 */
export function getReportDefinition( id: string | undefined ): ReportDefinition | undefined {
	const definition = id && Object.hasOwn( REPORTS, id ) ? REPORTS[ id ] : undefined;

	if ( definition?.isAvailable && ! definition.isAvailable() ) {
		return undefined;
	}

	if ( definition && ! isDashboardSectionInPreviewScope( definition.dashboardSection ) ) {
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
