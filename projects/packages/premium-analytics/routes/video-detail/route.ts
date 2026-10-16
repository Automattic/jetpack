/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	getStatsDatePolicy,
	needsReportDateParamsSeed,
} from '@jetpack-premium-analytics/data';
import {
	pickDashboardOriginParams,
	pickReportOriginParams,
} from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { seedDetailDateParams } from '../detail-date-seed';
import { redirectIfReportLocked } from '../reports/redirect-if-locked';
import { getReportDefinition } from '../reports/registry';
import { isPremiumAnalyticsSiteConnected, isVideoPressAvailable } from '../site-readiness';
import { limitStatsDateSearch } from '../stats-date-window';

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
 * The page is available only to connected sites running VideoPress, and only
 * for positive integer attachment IDs.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: VideoDetailParams; search?: VideoDetailSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		// Kept apart from the id check below: an unsupported site and a malformed id
		// are different events, even though both currently land on the dashboard.
		if ( ! isVideoPressAvailable() ) {
			throw redirect( { to: '/' } );
		}

		// This is the Videos report's detail page, so it follows that report out of
		// scope rather than declaring a tab of its own.
		if ( ! getReportDefinition( 'videos' ) ) {
			throw redirect( { to: '/' } );
		}

		redirectIfReportLocked( 'videos', search );

		const videoId = params?.videoId;
		if ( ! isValidVideoId( videoId ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as VideoDetailSearch;
		const needsDateSeed = needsReportDateParamsSeed(
			currentSearch,
			getStatsDatePolicy().lockedIntervals
		);
		const needsPostSeed = currentSearch.post_id !== videoId;

		if ( needsDateSeed || needsPostSeed ) {
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

			// The report origin joins the allowlist below so the breadcrumb keeps
			// its link back to the referring report across this seed.
			const reportParams = seedDetailDateParams( currentSearch, videoId );
			delete reportParams.author_id;
			const seeded: Record< string, unknown > = {
				...reportParams,
				...pickReportOriginParams( currentSearch ),
				...pickDashboardOriginParams( currentSearch ),
				post_id: videoId,
			};

			throw redirect( {
				to: '/video/$videoId',
				/*
				 * The router is built dynamically, so `/video/$videoId` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`); cast as the routing package does when it writes the URL.
				 */
				params: { videoId } as unknown as never,
				replace: true,
				viewTransition: false,
				// An arrival seeds all time, not a window the reader asked for, so it gets no notice.
				search: ( limitStatsDateSearch( seeded, needsPostSeed ? {} : currentSearch ) ??
					seeded ) as unknown as never,
			} );
		}

		const limited = limitStatsDateSearch( currentSearch );
		if ( limited ) {
			throw redirect( {
				to: '/video/$videoId',
				params: { videoId } as unknown as never,
				replace: true,
				viewTransition: false,
				search: limited as unknown as never,
			} );
		}
	},
};
