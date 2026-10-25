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
import { getAdminUrl, isSimpleSite } from '@automattic/jetpack-script-data';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { video as videoIcon } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { toVideoPlaysRows, type VideoPlaysRow } from './build-video-plays-data';
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
	// A failed request resolves with `records: null`, never with an error status.
	const { records: videos, hasResolved: hasCheckedMedia } = useEntityRecords< { id: number } >(
		'postType',
		'attachment',
		{
			per_page: 1,
			_fields: 'id',
			videopress_has_guid: 1,
			...( isSimpleSite() ? { videopress_only_videos: 1 } : {} ),
		},
		{ enabled: canUpload }
	);
	const isCheckingMedia = isCheckingPermission || ( canUpload && ! hasCheckedMedia );
	const hasNoVideos = canUpload && videos?.length === 0;

	useReportActions( {
		csv: {
			report: 'videos',
			status: { isLoading: isInitialLoading, isFetching, isError: primary.isError },
			rowCount: rows.length,
		},
	} );

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
			empty={
				hasNoVideos
					? {
							description: __( 'You don’t have videos uploaded yet.', 'jetpack-videopress-pkg' ),
							action: {
								label: __( 'Upload video', 'jetpack-videopress-pkg' ),
								href: getAdminUrl( 'media-new.php' ),
							},
						}
					: undefined
			}
		/>
	);
}

/**
 * The Top videos widget: a leaderboard of the site's most played VideoPress videos.
 *
 * @param props            - Widget render props.
 * @param props.attributes - Widget attributes, with the report params the dashboard injects.
 * @param props.setError   - Dashboard error handler.
 * @return The widget.
 */
export default function TopVideos( { attributes = {}, setError }: TopVideosWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TopVideosReport />
		</WidgetRoot>
	);
}
