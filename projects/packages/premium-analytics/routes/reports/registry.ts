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
	 * Translated page title, resolved lazily.
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
		getTitle: () => __( 'Annual insights', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'Year-by-year publishing and engagement totals.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './annual-insights/page' ),
	},
	authors: {
		id: 'authors',
		getTitle: () => __( 'Top authors', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './authors/page' ),
	},
	'comment-followers': {
		id: 'comment-followers',
		getTitle: () => __( 'Comments Subscribers', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './comment-followers/page' ),
	},
	clicks: {
		id: 'clicks',
		getTitle: () => __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './clicks/page' ),
	},
	comments: {
		id: 'comments',
		getTitle: () => __( 'Comments', 'jetpack-premium-analytics-pkg' ),
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
		getTitle: () => __( 'File downloads', 'jetpack-premium-analytics-pkg' ),
		// File download tracking happens on WPCOM infrastructure; Calypso only
		// shows the module on Simple sites ("not yet supported in Jetpack
		// environment") and we mirror that boundary. Mirrors the widget-level
		// gate in `src/widget-type-support.php`.
		isAvailable: isSimpleSite,
		load: () => import( './downloads/page' ),
	},
	emails: {
		id: 'emails',
		getTitle: () => __( 'Emails', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'Open and click performance of your latest emails.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './emails/page' ),
	},
	locations: {
		id: 'locations',
		getTitle: () => __( 'Locations', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'See where your visitors are viewing from.', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveLocationsSection,
		load: () => import( './locations/page' ),
	},
	posts: {
		id: 'posts',
		getTitle: () => __( 'Posts & Pages', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'All your posts and archive pages.', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveTabId,
		load: () => import( './posts/page' ),
	},
	'search-terms': {
		id: 'search-terms',
		getTitle: () => __( 'Search terms', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './search-terms/page' ),
	},
	tags: {
		id: 'tags',
		getTitle: () => __( 'Tags & categories', 'jetpack-premium-analytics-pkg' ),
		getDescription: () =>
			__( 'Your most visited tags and categories.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './tags/page' ),
	},
	videos: {
		id: 'videos',
		getTitle: () => __( 'Videos', 'jetpack-premium-analytics-pkg' ),
		getDescription: () => __( 'See how your videos perform.', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './videos/page' ),
	},
	utm: {
		id: 'utm',
		getTitle: () => __( 'UTM', 'jetpack-premium-analytics-pkg' ),
		resolveSection: resolveUtmSection,
		load: () => import( './utm/page' ),
	},
	referrers: {
		id: 'referrers',
		getTitle: () => __( 'Referrers', 'jetpack-premium-analytics-pkg' ),
		load: () => import( './referrers/page' ),
	},
};

/**
 * Look up a report definition by its id.
 *
 * @param id - The `$report` path segment (may be missing on a malformed URL).
 * @return The matching definition, or `undefined` when the id is missing or unknown.
 */
export function getReportDefinition( id: string | undefined ): ReportDefinition | undefined {
	const definition = id ? REPORTS[ id ] : undefined;

	if ( definition?.isAvailable && ! definition.isAvailable() ) {
		return undefined;
	}

	return definition;
}
