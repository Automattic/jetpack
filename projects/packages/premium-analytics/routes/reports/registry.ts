/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
// Import the tab resolver from `config/tabs` directly rather than the report's
// `config` barrel. `route.ts` imports this registry in `beforeLoad`, so the
// registry must stay free of React/UI at module scope; the `config/index.ts`
// barrel re-exports `fields.tsx` (JSX + `@wordpress/route` Link), which would
// pull the UI into the route guard's import chain. `config/tabs.ts` only
// depends on the routing helper and i18n, so it's safe to import here.
import { resolveTabId as resolveCommentsTabId } from './comments/config/tabs';
import { resolveSection as resolveLocationsSection } from './locations/config/tabs';
import { resolveTabId } from './posts/config/tabs';
import { resolveSection as resolveUtmSection } from './utm/config/tabs';
import type { ComponentType } from 'react';

/**
 * A single report's registration in the report registry.
 *
 * One dynamic route (`/reports/$report`) serves every report; a definition
 * describes one report and the stage renders its page component. Labels are
 * getters (resolved at call time) rather than plain strings so translations
 * apply after the i18n locale data has loaded — the same lazy-label convention
 * the section/tab definitions use (see `config/tabs.ts` on the tabbed routes).
 *
 * `load` is a dynamic import of the report's page component so the registry
 * itself stays free of React/UI at module scope: `route.ts` imports this module
 * in `beforeLoad` (which runs before the page bundle needs React), so pulling a
 * component in at the top level here would drag the UI into the route guard.
 */
export type ReportDefinition = {
	/**
	 * Stable, URL-friendly identifier. Matches the `$report` path segment
	 * (e.g. `/reports/posts`) and keys the lazy component in the stage.
	 */
	id: string;

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
	 * Optional translated page description, resolved lazily.
	 */
	getDescription?: () => string;

	/**
	 * Resolve a raw `?section=` value to a section this report owns, falling
	 * back to the report's default section — mirroring the per-page
	 * `resolveTabId` used by the tabbed routes so a shareable URL never persists
	 * a section the report can't render. Omit for reports that have no sections.
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
 * To add a report, drop a `<id>/` module folder under `routes/reports/` that
 * default-exports its page component and add one entry here; no new route is
 * needed (see this folder's README).
 */
export const REPORTS: Record< string, ReportDefinition > = {
	'annual-insights': {
		id: 'annual-insights',
		getLabel: () => __( 'Annual insights', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Annual insights report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'Year-by-year publishing and engagement totals.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './annual-insights/page' ),
	},
	authors: {
		id: 'authors',
		getLabel: () => __( 'Top authors', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Top authors report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './authors/page' ),
	},
	'comment-followers': {
		id: 'comment-followers',
		getLabel: () => __( 'Comments Subscribers', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Comments Subscribers report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './comment-followers/page' ),
	},
	clicks: {
		id: 'clicks',
		getLabel: () => __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Clicks report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './clicks/page' ),
	},
	comments: {
		id: 'comments',
		getLabel: () => __( 'All comments', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All comments report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__(
				'Learn about the comments your site receives by authors, posts, and pages.',
				'jetpack-premium-analytics-pkg'
			),
		resolveSection: resolveCommentsTabId,
		load: () => import( './comments/page' ),
	},
	downloads: {
		id: 'downloads',
		getLabel: () => __( 'File downloads', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'File downloads report', 'jetpack-premium-analytics-pkg' ),
		// File download tracking happens on WPCOM infrastructure; Calypso only
		// shows the module on Simple sites ("not yet supported in Jetpack
		// environment") and we mirror that boundary. Mirrors the widget-level
		// gate in `src/widget-type-support.php`.
		isAvailable: isSimpleSite,
		load: () => import( './downloads/page' ),
	},
	emails: {
		id: 'emails',
		getLabel: () => __( 'Emails', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Emails report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'Open and click performance of your latest emails.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './emails/page' ),
	},
	locations: {
		id: 'locations',
		getLabel: () => __( 'All locations', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All locations report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'See where your visitors are viewing from.', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveLocationsSection,
		load: () => import( './locations/page' ),
	},
	posts: {
		id: 'posts',
		getLabel: () => __( 'All pages', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All pages report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'All your posts and archive pages.', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveTabId,
		load: () => import( './posts/page' ),
	},
	'search-terms': {
		id: 'search-terms',
		getLabel: () => __( 'Search terms', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Search terms report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './search-terms/page' ),
	},
	tags: {
		id: 'tags',
		getLabel: () => __( 'Tags & categories', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Tags & categories report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'Your most visited tags and categories.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './tags/page' ),
	},
	videos: {
		id: 'videos',
		getLabel: () => __( 'Videos', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Videos report', 'jetpack-premium-analytics-pkg' ),
		getDescription: () => __( 'See how your videos perform.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './videos/page' ),
	},
	utm: {
		id: 'utm',
		getLabel: () => __( 'All UTM values', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'All UTM values report', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveUtmSection,
		load: () => import( './utm/page' ),
	},
	referrers: {
		id: 'referrers',
		getLabel: () => __( 'Referrers', 'jetpack-premium-analytics-pkg' ),
		getTitle: () => __( 'Referrers report', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './referrers/page' ),
	},
};

/**
 * Look up a report definition by its id.
 *
 * The id comes from the URL, so the lookup is an own-property check: a plain
 * index would resolve an inherited name such as `constructor` to a function and
 * hand back something that is not a report definition.
 *
 * @param id - The `$report` path segment (may be missing on a malformed URL).
 * @return The matching definition, or `undefined` when the id is missing or unknown.
 */
export function getReportDefinition( id: string | undefined ): ReportDefinition | undefined {
	const definition = id && Object.hasOwn( REPORTS, id ) ? REPORTS[ id ] : undefined;

	if ( definition?.isAvailable && ! definition.isAvailable() ) {
		return undefined;
	}

	return definition;
}

/**
 * Resolve the report origin behind a detail breadcrumb.
 *
 * A section is kept only when the referring report defines a section resolver
 * and the value round-trips through it, so a section belonging to a different
 * report — or one that report can no longer render — is never linked.
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
