/**
 * External dependencies
 */
import { getSectionDatePolicy } from '@jetpack-premium-analytics/data';
import {
	pickDashboardOriginParams,
	pickReportOriginParams,
} from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { dateWindowRedirect } from '../date-window-redirect';
import { seedDetailDateParams } from '../detail-date-seed';
import { getReportDefinition } from '../reports/registry';
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
 * to this single resource.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: PostDetailParams; search?: PostDetailSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		// This is the All pages report's detail page, so it follows that report out of
		// scope rather than declaring a tab of its own.
		if ( ! getReportDefinition( 'posts' ) ) {
			throw redirect( { to: '/' } );
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
		const policy = getSectionDatePolicy( getReportDefinition( 'posts' )?.dashboardSection );
		const needsPostSeed = currentSearch.post_id !== postId;
		const needsSectionSeed = !! currentSearch.section && resolvedSection !== currentSearch.section;

		const limited = await dateWindowRedirect( currentSearch, policy, {
			seed: () => {
				// Allowlist this page's own params instead of spreading `currentSearch`
				// wholesale; the report origin stays so the breadcrumb survives.
				const reportParams = seedDetailDateParams( currentSearch, postId );
				delete reportParams.author_id;
				return {
					...reportParams,
					...pickReportOriginParams( currentSearch ),
					...pickDashboardOriginParams( currentSearch ),
					...( resolvedSection ? { section: resolvedSection } : {} ),
					post_id: postId,
				};
			},
			needsSeed: needsPostSeed || needsSectionSeed,
			// An arrival seeds all time, not a window the reader asked for, so it gets no notice.
			requested: needsPostSeed ? undefined : currentSearch,
		} );
		if ( limited ) {
			throw redirect( {
				to: '/post/$postId',
				/*
				 * The router is built dynamically, so `/post/$postId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`); cast as the routing package does when it writes the URL.
				 */
				params: { postId } as unknown as never,
				replace: true,
				viewTransition: false,
				search: limited.search as unknown as never,
				state: limited.state,
			} );
		}
	},
};
