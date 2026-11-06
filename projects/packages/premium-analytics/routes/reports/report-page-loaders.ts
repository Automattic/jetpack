/**
 * External dependencies
 */
import type { ComponentType } from 'react';

type ReportPageModule = { default: ComponentType };
type ReportPageLoader = () => Promise< ReportPageModule >;

const loadedReportPages = new Map< string, ReportPageModule >();
const pendingReportPages = new Map< string, Promise< ReportPageModule > >();

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
	const loader = Object.hasOwn( REPORT_PAGE_LOADERS, id ) ? REPORT_PAGE_LOADERS[ id ] : undefined;

	if ( ! loader ) {
		return undefined;
	}

	return () => {
		const loaded = loadedReportPages.get( id );
		if ( loaded ) {
			return Promise.resolve( loaded );
		}

		const pending = pendingReportPages.get( id );
		if ( pending ) {
			return pending;
		}

		const request = loader().then(
			module => {
				loadedReportPages.set( id, module );
				pendingReportPages.delete( id );
				return module;
			},
			error => {
				pendingReportPages.delete( id );
				throw error;
			}
		);
		pendingReportPages.set( id, request );
		return request;
	};
}

/**
 * Load a report page before navigation can expose its Suspense fallback.
 *
 * @param id - A report id from the registry.
 */
export async function preloadReportPage( id: string ): Promise< void > {
	try {
		await getReportPageLoader( id )?.();
	} catch {
		// The route retries and surfaces a chunk failure if the report is opened.
	}
}

/**
 * Return a report page that finished preloading.
 *
 * @param id - A report id from the registry.
 * @return The loaded report component, or `undefined`.
 */
export function getLoadedReportPage( id: string ): ComponentType | undefined {
	return loadedReportPages.get( id )?.default;
}
