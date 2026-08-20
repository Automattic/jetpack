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
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
	isVideoPressAvailable,
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
 * The page is available only to connected sites running VideoPress, after the
 * initial analytics sync, and only for positive integer attachment IDs.
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

		// Kept apart from the id check below: a bookmarked URL on a site without
		// VideoPress and a malformed one are different events, even though both
		// currently land on the dashboard.
		if ( ! isVideoPressAvailable() ) {
			throw redirect( { to: '/' } );
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
			 * Warm the core `site` record before the stage renders, so
			 * `useSiteHomeUrl()` has it. A rejection here shouldn't error the
			 * whole page, so fall through to the seed. The seed's own dates do
			 * not depend on this; they resolve from the WordPress date settings.
			 */
			try {
				await ensureCoreSettingsReady();
			} catch {
				// Proceed with the default seed below.
			}

			// The report origin joins the allowlist below so the breadcrumb keeps
			// its link back to the referring report across this seed.
			const seeded: Record< string, unknown > = {
				...normalizeReportParams(
					currentSearch as Parameters< typeof normalizeReportParams >[ 0 ]
				),
				...pickReportOriginParams( currentSearch ),
				post_id: videoId,
			};

			/*
			 * Comparison params ride along untouched: this page renders no
			 * comparison (the stage strips them from the reportParams it injects
			 * into its widgets), but the dashboard link and
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
