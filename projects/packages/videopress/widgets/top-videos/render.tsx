/**
 * External dependencies
 */
import {
	Leaderboard,
	WidgetRoot,
	describeError,
	useStatsVideoPlays,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@automattic/jetpack-premium-analytics-sdk';
import { currentUserCan, getAdminUrl, isSimpleSite } from '@automattic/jetpack-script-data';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { video as videoIcon } from '@wordpress/icons';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { VIDEOPRESS_ADMIN_PAGE } from '../../src/dashboard/utils/constants';
import { toVideoPlaysRows, type VideoPlaysRow } from './build-video-plays-data';
import { VideoUploader, useVideoUpload } from './components/video-uploader';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

/** No configurable attributes; the empty record allows host-provided fields. */
export type TopVideosAttributes = Record< never, never >;

// Videos the widget asks for. The leaderboard applies the dashboard's own cap to what it shows.
const TOP_VIDEOS_LIMIT = 10;

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget has no settings of its own.
type TopVideosRenderAttributes = TopVideosAttributes & Partial< ReportParamsFieldAttributes >;

type TopVideosWidgetProps = WidgetRenderProps< TopVideosRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Maps a normalized video row to a leaderboard row.
 *
 * @param row - Normalized video row.
 * @return The leaderboard row.
 */
function toLeaderboardRow( row: VideoPlaysRow ): LeaderboardRowInput {
	return {
		id: row.key,
		label: row.label,
		value: row.plays,
		previousValue: row.previousPlays,
		media: {
			kind: 'thumbnail',
			url: row.posterUrl,
			alt: '',
			fallbackIcon: videoIcon,
		},
		action: { kind: 'videoLink', id: row.id, href: row.link },
	};
}

/**
 * Fetches the video-plays report through the dashboard's Stats hook and renders the
 * rows as a leaderboard.
 *
 * @return The widget content.
 */
function TopVideosReport() {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo(
		() => ( { ...reportParams, max: TOP_VIDEOS_LIMIT } ),
		[ reportParams ]
	);

	// The hook merges comparison rows and gates `hasComparison` on at least one
	// visible row having a match, so the chart never fabricates vs-zero deltas.
	const { primary, comparisonRows, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsVideoPlays( statsParams, { maxRows: TOP_VIDEOS_LIMIT } );

	const rows = useMemo(
		() => toVideoPlaysRows( comparisonRows?.rows ?? [] ).map( toLeaderboardRow ),
		[ comparisonRows ]
	);
	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = isLoading || primary.isPending;
	const hasNoPlays = ! isInitialLoading && ! isError && rows.length === 0;
	const { canUpload, isCheckingPermission } = useSelect(
		select => {
			if ( ! hasNoPlays ) {
				return { canUpload: false, isCheckingPermission: false };
			}
			const { canUser, hasFinishedResolution } = select( coreStore );
			return {
				canUpload: canUser( 'create', 'media' ) === true,
				// A failed permission request finishes without a value.
				isCheckingPermission: ! hasFinishedResolution( 'canUser', [ 'create', 'media' ] ),
			};
		},
		[ hasNoPlays ]
	);
	const mediaQuery = useMemo(
		() => ( {
			per_page: 1,
			_fields: 'id',
			videopress_has_guid: 1,
			...( isSimpleSite() ? { videopress_only_videos: 1 } : {} ),
		} ),
		[]
	);
	// A failed request resolves with `records: null`, never with an error status.
	const { records: videos, hasResolved: hasCheckedMedia } = useEntityRecords< { id: number } >(
		'postType',
		'attachment',
		mediaQuery,
		{ enabled: canUpload }
	);
	const isCheckingMedia = isCheckingPermission || ( canUpload && ! hasCheckedMedia );
	const hasNoVideos = canUpload && videos?.length === 0;

	const { invalidateResolution } = useDispatch( coreStore );
	// core-data caches the empty-library answer; drop it so the next mount sees the video.
	const onUploaded = useCallback(
		() => invalidateResolution( 'getEntityRecords', [ 'postType', 'attachment', mediaQuery ] ),
		[ invalidateResolution, mediaQuery ]
	);
	const { phase, upload } = useVideoUpload( onUploaded );

	useReportActions( {
		csv: {
			report: 'videos',
			status: { isLoading: isInitialLoading, isFetching, isError: primary.isError },
			rowCount: rows.length,
		},
	} );

	// Once an upload starts it stays on screen: a range change or a failed stats request
	// must not swap it for the leaderboard, and a landed video must not give way to it.
	if ( phase.status !== 'idle' || hasNoVideos ) {
		return <VideoUploader phase={ phase } onUpload={ upload } />;
	}

	return (
		<Leaderboard
			chartTitle={ __( 'Top videos', 'jetpack-videopress-pkg' ) }
			rows={ rows }
			columns={ { label: __( 'Videos', 'jetpack-videopress-pkg' ), metric: 'views' } }
			status={ {
				isLoading: isInitialLoading || isCheckingMedia,
				isFetching,
				// `placeholderData` keeps prior rows visible after a failed range change; only
				// surface the error when nothing is on screen.
				isError: rows.length === 0 && isError,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load video plays. Please try again in a moment.",
					'jetpack-videopress-pkg'
				),
				onRetry: refetch,
			} ) }
			// The generic "no results" reads as a search miss; name the plays and point at the videos.
			empty={
				hasNoPlays && ! isCheckingMedia
					? {
							icon: videoIcon,
							description: __( 'No video plays in this period yet.', 'jetpack-videopress-pkg' ),
							action:
								canUpload && currentUserCan( 'manage_options' )
									? {
											label: __( 'Manage videos', 'jetpack-videopress-pkg' ),
											href: getAdminUrl( VIDEOPRESS_ADMIN_PAGE ),
										}
									: undefined,
						}
					: undefined
			}
		/>
	);
}

/**
 * The Top videos widget: a leaderboard of the site's most played VideoPress videos.
 *
 * @param {TopVideosWidgetProps} props - Widget render props.
 *
 * @return The widget.
 */
export default function TopVideos( { attributes = {}, setError }: TopVideosWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TopVideosReport />
		</WidgetRoot>
	);
}
