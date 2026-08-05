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
import { ensureDashboardEntities } from '../dashboard-entities';
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
} from '../site-readiness';

type VideoDetailParams = { videoId?: string };
type VideoDetailSearch = Record< string, string | undefined >;

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
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				post_id: videoId,
			};

			/*
			 * Comparison params ride along untouched: this page renders no
			 * comparison (its widgets ignore them), but the dashboard link and
			 * "Back to Videos" carry the URL state back out, so stripping them
			 * here would silently lose the user's comparison settings on a
			 * Dashboard → Video → Dashboard round trip.
			 */

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

		ensureDashboardEntities();
	},
};
