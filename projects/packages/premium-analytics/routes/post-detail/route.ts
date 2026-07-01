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

type PostDetailParams = { postId?: string };
type PostDetailSearch = Record< string, string | undefined >;

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

		// Only seed a scope for a valid positive-integer post/page ID, so a bad
		// deep link like `/post/foo` never puts a malformed `post_id` into the URL.
		const postId =
			params?.postId && /^\d+$/.test( params.postId ) && Number( params.postId ) > 0
				? params.postId
				: undefined;
		const currentSearch = ( search ?? {} ) as PostDetailSearch;
		const needsDateSeed = ! currentSearch.from || ! currentSearch.to || ! currentSearch.interval;
		const needsPostSeed = !! postId && currentSearch.post_id !== postId;

		if ( needsDateSeed || needsPostSeed ) {
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

			const seeded: Record< string, unknown > = {
				...currentSearch,
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				...( postId ? { post_id: postId } : {} ),
			};

			throw redirect( {
				to: '/post/$postId',
				/*
				 * The router is built dynamically, so `/post/$postId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`). Cast the same way the routing package does when it
				 * writes the URL. Preserve the raw path param so the redirect stays
				 * on the current route even when the ID isn't a valid scope.
				 */
				params: { postId: params?.postId } as unknown as never,
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
