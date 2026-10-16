/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	getStatsDatePolicy,
	needsReportDateParamsSeed,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { pickDashboardOriginParams } from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { routePathname } from '../date-window-notice';
import { redirectIfReportLocked } from '../reports/redirect-if-locked';
import { getReportDefinition } from '../reports/registry';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { limitStatsDateSearch } from '../stats-date-window';

type AuthorDetailParams = { authorId?: string };
type AuthorDetailSearch = Record< string, string | undefined >;

/**
 * Whether a raw path parameter identifies a user (a positive integer).
 *
 * @param value - The raw `authorId` path parameter.
 * @return Whether the value is a valid author ID.
 */
function isValidAuthorId( value: string | undefined ): value is string {
	return !! value && /^\d+$/.test( value ) && Number( value ) > 0;
}

/**
 * Route lifecycle for the author detail page.
 *
 * `author_id` is seeded from the route param so every widget on the page is
 * scoped to this one author.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: AuthorDetailParams; search?: AuthorDetailSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		// This is the Authors report's detail page, so it follows that report out
		// of scope rather than declaring a tab of its own.
		if ( ! getReportDefinition( 'authors' ) ) {
			throw redirect( { to: '/' } );
		}

		redirectIfReportLocked( 'authors', search );

		// A malformed path param would render site-wide stats under an author
		// header; this also closes the `?author_id=` spoof.
		const authorId = params?.authorId;
		if ( ! isValidAuthorId( authorId ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as AuthorDetailSearch;
		const pathname = routePathname( '/author/$authorId', { authorId } );
		const needsDateSeed = needsReportDateParamsSeed(
			currentSearch,
			getStatsDatePolicy().lockedIntervals
		);
		const needsAuthorSeed = currentSearch.author_id !== authorId;

		// The seed mirrors post-detail/route.ts, which explains each step; this
		// page carries no report origin, since its breadcrumb is fixed.
		if ( needsDateSeed || needsAuthorSeed ) {
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			const reportParams = normalizeReportParams(
				currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
			);
			delete reportParams.post_id;
			const seeded: Record< string, unknown > = {
				...reportParams,
				...pickDashboardOriginParams( currentSearch ),
				author_id: authorId,
			};

			throw redirect( {
				to: '/author/$authorId',
				params: { authorId } as unknown as never,
				replace: true,
				viewTransition: false,
				// An arrival carries the linking page's window, not one the reader asked of this page.
				search: ( limitStatsDateSearch( seeded, {
					pathname,
					requested: needsAuthorSeed ? {} : currentSearch,
				} ) ?? seeded ) as unknown as never,
			} );
		}

		const limited = limitStatsDateSearch( currentSearch, { pathname } );
		if ( limited ) {
			throw redirect( {
				to: '/author/$authorId',
				params: { authorId } as unknown as never,
				replace: true,
				viewTransition: false,
				search: limited as unknown as never,
			} );
		}
	},
};
