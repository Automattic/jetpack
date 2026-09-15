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
import { getReportDefinition } from '../reports/registry';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';

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

		// A malformed path param would render site-wide stats under an author
		// header; this also closes the `?author_id=` spoof.
		const authorId = params?.authorId;
		if ( ! isValidAuthorId( authorId ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as AuthorDetailSearch;
		const needsDateSeed = needsReportDateParamsSeed( currentSearch );
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
			const seeded: Record< string, unknown > = { ...reportParams, author_id: authorId };

			throw redirect( {
				to: '/author/$authorId',
				params: { authorId } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}
	},
};
