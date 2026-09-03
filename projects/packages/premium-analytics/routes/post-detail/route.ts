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
import { ensureDashboardEntities } from '../dashboard-entities';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { resolveTabId } from './config';

type PostDetailParams = { postId?: string };
type PostDetailSearch = Record< string, string | undefined >;

/**
 * Whether a raw path param is a valid single-post scope (a positive integer).
 *
 * @param value - The raw `postId` path param.
 * @return Whether it identifies a post/page.
 */
function isValidPostId( value: string | undefined ): value is string {
	return !! value && /^\d+$/.test( value ) && Number( value ) > 0;
}

/**
 * Route lifecycle for the post/page detail page.
 *
 * `post_id` is seeded from the route param so every widget on the page is scoped
 * to this single resource. The widget-modules entity is registered here too, so
 * a direct deep link resolves widget types without visiting the dashboard first.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: PostDetailParams; search?: PostDetailSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		// A malformed path param would render site-wide stats under a
		// single-post header; this also closes the `?post_id=` spoof.
		const postId = params?.postId;
		if ( ! isValidPostId( postId ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as PostDetailSearch;
		// A `section` from an inbound link may not be a valid post-detail tab, so
		// resolve it rather than persist a bogus tab in a shareable URL.
		const resolvedSection = currentSearch.section
			? resolveTabId( currentSearch.section )
			: undefined;
		const needsDateSeed = needsReportDateParamsSeed( currentSearch );
		const needsPostSeed = currentSearch.post_id !== postId;
		const needsSectionSeed = !! currentSearch.section && resolvedSection !== currentSearch.section;

		if ( needsDateSeed || needsPostSeed || needsSectionSeed ) {
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
			// wholesale; the report origin stays so the breadcrumb survives.
			const seeded: Record< string, unknown > = {
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				...pickReportOriginParams( currentSearch ),
				...( resolvedSection ? { section: resolvedSection } : {} ),
				post_id: postId,
			};

			/*
			 * Comparison params ride along untouched: this page renders no
			 * comparison, but the breadcrumb's dashboard link carries the URL state
			 * back out, so stripping them would lose the setting on a round trip.
			 */

			throw redirect( {
				to: '/post/$postId',
				/*
				 * The router is built dynamically, so `/post/$postId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`); cast as the routing package does when it writes the URL.
				 */
				params: { postId } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}

		ensureDashboardEntities();
	},
};
