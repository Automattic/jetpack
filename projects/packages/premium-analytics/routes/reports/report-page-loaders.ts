/**
 * External dependencies
 */
import type { ComponentType } from 'react';

type ReportPageLoader = () => Promise< { default: ComponentType } >;

/**
 * Dynamic imports of each report's page component, keyed by report id.
 *
 * Kept out of `registry.ts` because the route guards import the registry, and the `route.js` bundle has no code splitting: a loader there inlines every report page into it.
 */
export const REPORT_PAGE_LOADERS: Record< string, ReportPageLoader > = {
	'annual-insights': () => import( './annual-insights/page' ),
	authors: () => import( './authors/page' ),
	'comment-followers': () => import( './comment-followers/page' ),
	clicks: () => import( './clicks/page' ),
	comments: () => import( './comments/page' ),
	downloads: () => import( './downloads/page' ),
	earnings: () => import( './earnings/page' ),
	emails: () => import( './emails/page' ),
	locations: () => import( './locations/page' ),
	posts: () => import( './posts/page' ),
	'search-terms': () => import( './search-terms/page' ),
	tags: () => import( './tags/page' ),
	videos: () => import( './videos/page' ),
	utm: () => import( './utm/page' ),
	referrers: () => import( './referrers/page' ),
};

/**
 * Look up the page loader for a report.
 *
 * @param id - A report id from the registry.
 * @return The loader, or `undefined` for an id with no page.
 */
export function getReportPageLoader( id: string ): ReportPageLoader | undefined {
	return Object.hasOwn( REPORT_PAGE_LOADERS, id ) ? REPORT_PAGE_LOADERS[ id ] : undefined;
}
