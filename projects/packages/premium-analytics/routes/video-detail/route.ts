/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	needsReportDateParamsSeed,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from '../dashboard/hooks/constants';
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
} from '../site-readiness';

type VideoDetailParams = { videoId?: string };
type VideoDetailSearch = Record< string, string | undefined >;

// The video detail design has no period-over-period comparison, so these
// params are normalized out of the URL — whether hand-edited in, carried over
// from another report, or added by the default date seed.
const COMPARISON_SEARCH_PARAMS = [ 'comp', 'compare_from', 'compare_to', 'compare_preset' ];

/**
 * Whether a raw path parameter identifies a positive integer video attachment.
 *
 * @param value - The raw `videoId` path parameter.
 * @return Whether the value is a valid video ID.
 */
function isValidVideoId( value: string | undefined ): value is string {
	return !! value && /^\d+$/.test( value ) && Number( value ) > 0;
}

/**
 * Route lifecycle for the video detail page.
 *
 * The page is available only to connected sites after the initial analytics
 * sync, and only for positive integer attachment IDs.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: VideoDetailParams; search?: VideoDetailSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		if ( ! isPremiumAnalyticsInitialSyncFinished() ) {
			throw redirect( { to: '/syncing' } );
		}

		const videoId = params?.videoId;
		if ( ! isValidVideoId( videoId ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as VideoDetailSearch;
		const needsDateSeed = needsReportDateParamsSeed( currentSearch );
		const needsPostSeed = currentSearch.post_id !== videoId;
		const hasComparisonParams = COMPARISON_SEARCH_PARAMS.some(
			param => currentSearch[ param ] !== undefined
		);

		if ( needsDateSeed || needsPostSeed || hasComparisonParams ) {
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
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				post_id: videoId,
			};

			// `normalizeReportParams` carries incoming comparison params through
			// (and adds the default comparison on a fresh load); this page has no
			// comparison, so drop them before they reach the URL and the widgets.
			for ( const param of COMPARISON_SEARCH_PARAMS ) {
				delete seeded[ param ];
			}

			throw redirect( {
				to: '/video/$videoId',
				/*
				 * The router is built dynamically, so `/video/$videoId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`). Cast the same way the routing package does when it
				 * writes the URL.
				 */
				params: { videoId } as unknown as never,
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
				label: __( 'Widget modules', 'jetpack-premium-analytics-pkg' ),
				supportsPagination: false,
			},
		] );
	},
};
