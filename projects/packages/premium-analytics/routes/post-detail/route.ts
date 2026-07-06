/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { ensureCoreSettingsReady, normalizeReportParams } from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from '../dashboard/hooks/constants';
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
 * Guards mirror the dashboard (not connected → /connect, sync pending →
 * /syncing). On first visit it seeds the URL search so the date picker and the
 * widgets share a populated state, and it seeds `post_id` from the route param
 * so every widget on the page is scoped to this single resource. The
 * widget-modules discovery entity is registered here too (idempotently) so a
 * direct deep link resolves widget types without first visiting the dashboard.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: PostDetailParams; search?: PostDetailSearch } = {} ) => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing' } );
		}

		// A malformed path param (e.g. `/post/foo`) has no single-post view to
		// show, and letting it through would render site-wide stats under a
		// single-post header. Send it back to the dashboard rather than present
		// unscoped data as if it were scoped. This also closes the spoof where a
		// `?post_id=` query on an invalid path could bind the page to a different
		// post than the URL claims.
		const postId = params?.postId;
		if ( ! isValidPostId( postId ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as PostDetailSearch;
		// A `section` carried in from a link may not be a valid post-detail tab
		// (e.g. a dashboard section forwarded by a widget link); resolve it so a
		// shareable URL never persists a bogus tab.
		const resolvedSection = currentSearch.section
			? resolveTabId( currentSearch.section )
			: undefined;
		const needsDateSeed = ! currentSearch.from || ! currentSearch.to || ! currentSearch.interval;
		const needsPostSeed = currentSearch.post_id !== postId;
		const needsSectionSeed = !! currentSearch.section && resolvedSection !== currentSearch.section;

		if ( needsDateSeed || needsPostSeed || needsSectionSeed ) {
			/*
			 * Seed dates in the site timezone, not the browser's, by waiting for
			 * core `site` settings. A rejection here shouldn't error the whole
			 * page, so fall back to the default seed.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			// Allowlist the params this page owns rather than spreading
			// `currentSearch` wholesale: `normalizeReportParams` yields only the
			// known report-window params, and the path-derived `post_id` is the
			// single source of scope. This contains any foreign params a link
			// carried in (e.g. a dashboard `section`) instead of persisting them.
			const seeded: Record< string, unknown > = {
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				...( resolvedSection ? { section: resolvedSection } : {} ),
				post_id: postId,
			};

			throw redirect( {
				to: '/post/$postId',
				/*
				 * The router is built dynamically, so `/post/$postId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`). Cast the same way the routing package does when it
				 * writes the URL.
				 */
				params: { postId } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}

		const coreSelect = select( coreStore ) as unknown as {
			getEntityConfig: ( kind: string, name: string ) => unknown;
		};
		if ( coreSelect.getEntityConfig( 'root', 'widgetModule' ) ) {
			return;
		}

		const coreDispatch = dispatch( coreStore ) as unknown as {
			addEntities: ( entities: object[] ) => void;
		};
		coreDispatch.addEntities( [
			{
				name: 'widgetModule',
				kind: 'root',
				key: 'name',
				baseURL: `/${ DASHBOARD_REST_NAMESPACE }/widget-modules`,
				plural: 'widgetModules',
				label: __( 'Widget modules', 'jetpack-premium-analytics' ),
				supportsPagination: false,
			},
		] );
	},
};
