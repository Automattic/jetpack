/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	needsReportDateParamsSeed,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { pickReportOriginParams } from '@jetpack-premium-analytics/routing';
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

		if ( needsDateSeed || needsAuthorSeed ) {
			/*
			 * Warm the core `site` record for `useSiteHomeUrl()`. A rejection
			 * shouldn't error the whole page, and the seed's own dates don't
			 * depend on it, so fall through.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			// Allowlist this page's own params instead of spreading `currentSearch`
			// wholesale; the report origin stays so the dashboard link survives.
			const reportParams = normalizeReportParams(
				currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
			);
			// The other detail scope must not ride along into this page's URL.
			delete reportParams.post_id;
			const seeded: Record< string, unknown > = {
				...reportParams,
				...pickReportOriginParams( currentSearch ),
				author_id: authorId,
			};

			/*
			 * Comparison params ride along untouched: this page renders no
			 * comparison, but the breadcrumb links carry the URL state back out,
			 * so stripping them would lose the setting on a round trip.
			 */

			throw redirect( {
				to: '/author/$authorId',
				/*
				 * The router is built dynamically, so `/author/$authorId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`); cast as the routing package does when it writes the URL.
				 */
				params: { authorId } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}
	},
};
