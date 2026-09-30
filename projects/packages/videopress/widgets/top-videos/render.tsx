/**
 * External dependencies
 */
import {
	Leaderboard,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	describeError,
	useStatsVideoPlays,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { toVideoPlaysRows, type VideoPlaysRow } from './build-video-plays-data';
import type { TopVideosAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

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
		() => ( { ...reportParams, max: WIDGET_ROW_LIMIT } ),
		[ reportParams ]
	);

	// The hook merges comparison rows and gates `hasComparison` on at least one
	// visible row having a match, so the chart never fabricates vs-zero deltas.
	const { primary, comparisonRows, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsVideoPlays( statsParams, { maxRows: WIDGET_ROW_LIMIT } );

	const rows = useMemo(
		() => toVideoPlaysRows( comparisonRows?.rows ?? [] ).map( toLeaderboardRow ),
		[ comparisonRows ]
	);

	return (
		<Leaderboard
			rows={ rows }
			status={ {
				// `primary.isPending` also covers the brief window where the query is disabled
				// while the report params resolve (isLoading is false there).
				isLoading: isLoading || primary.isPending,
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
			footer={ <ReportLink report="videos" /> }
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
