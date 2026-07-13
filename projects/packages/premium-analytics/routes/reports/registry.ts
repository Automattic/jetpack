/**
 * External dependencies
 */
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
	 * Dynamic import of the report's page component (default export). Kept as a
	 * thunk so React/UI is only pulled in when the report actually renders, and
	 * so this module stays importable from `route.ts` guards.
	 */
	load: () => Promise< { default: ComponentType } >;
};

/**
 * The report registry: one entry per report, keyed by its `id`.
 *
 * EMPTY for now — the report-page framework ships without any registered
 * reports. A follow-up registers the first report (`posts`). To add a report,
 * drop a `<id>/` module folder under `routes/reports/` that default-exports its
 * page component and add one entry here; no new route is needed (see this
 * folder's README):
 *
 * ```ts
 * import { __ } from '@wordpress/i18n';
 *
 * export const REPORTS: Record< string, ReportDefinition > = {
 * 	posts: {
 * 		id: 'posts',
 * 		getTitle: () => __( 'Posts & pages', 'jetpack-premium-analytics' ),
 * 		load: () => import( './posts/page' ),
 * 	},
 * };
 * ```
 */
export const REPORTS: Record< string, ReportDefinition > = {};

/**
 * Look up a report definition by its id.
 *
 * @param id - The `$report` path segment (may be missing on a malformed URL).
 * @return The matching definition, or `undefined` when the id is missing or unknown.
 */
export function getReportDefinition( id: string | undefined ): ReportDefinition | undefined {
	return id ? REPORTS[ id ] : undefined;
}
