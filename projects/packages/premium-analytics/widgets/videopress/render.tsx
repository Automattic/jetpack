/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import {
	LeaderboardChart,
	ReportLink,
	VideoTitleLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	calculateDelta,
	getCombinedPeriodMax,
	sharePercentage,
	toMaxRows,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { toVideoPlaysRows, type VideoPlaysRow } from './build-video-plays-data';
import styles from './style.module.css';
import { DEFAULT_MAX, type VideoPressAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget's own settings come from `VideoPressAttributes`.
type VideoPressRenderAttributes = VideoPressAttributes & Partial< ReportParamsFieldAttributes >;

type VideoPressWidgetProps = WidgetRenderProps< VideoPressRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Build a video row's title. Attachment rows navigate to the internal detail
 * route; rows without an ID retain the original external-link fallback.
 *
 * @param row    - The normalized video row.
 * @param search - Shared report-window parameters for the detail route.
 * @return The linked or plain row title.
 */
function buildVideoTitle( row: VideoPlaysRow, search: Record< string, unknown > ): JSX.Element {
	return (
		<VideoTitleLink
			id={ row.id }
			label={ row.label }
			link={ row.link }
			search={ search }
			classNames={ {
				internal: styles.internalLink,
				external: styles.labelLink,
				plain: styles.labelText,
			} }
			title={ row.label }
		/>
	);
}

/**
 * Maps normalized video rows onto the shape `LeaderboardChart` expects. Shares
 * are computed against the largest value of either period so the overlay bars
 * stay proportional. Rows without a matching comparison-period value keep
 * comparison fields undefined so the chart suppresses fabricated deltas.
 *
 * @param rows   - The normalized video-plays rows.
 * @param search - Shared report-window parameters for detail links.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData(
	rows: VideoPlaysRow[],
	search: Record< string, unknown >
): LeaderboardChartData {
	const maxPlays = getCombinedPeriodMax(
		rows.map( row => row.plays ),
		rows.map( row => row.previousPlays )
	);

	return rows.map( row => ( {
		id: row.key,
		label: buildVideoTitle( row, search ),
		currentValue: row.plays,
		currentShare: sharePercentage( row.plays, maxPlays ),
		previousValue: row.previousPlays,
		previousShare:
			row.previousPlays !== undefined ? sharePercentage( row.previousPlays, maxPlays ) : undefined,
		delta:
			row.previousPlays !== undefined ? calculateDelta( row.plays, row.previousPlays ) : undefined,
	} ) );
}

type VideoPressReportProps = {
	/**
	 * Maximum number of videos to display.
	 */
	max: number;
};

/**
 * Fetches the video-plays report through the Jetpack Stats hook, builds the
 * leaderboard rows, and renders them through the shared widget content states.
 *
 * @param {VideoPressReportProps} props - The component props.
 * @return The widget content.
 */
function VideoPressReport( { max }: VideoPressReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo( () => ( { ...reportParams, max } ), [ reportParams, max ] );

	// The hook merges comparison rows in the data layer and gates
	// `hasComparison` on at least one visible row (`maxRows`) having a matching
	// comparison row, so the chart never fabricates vs-zero deltas.
	const {
		primary,
		comparisonRows,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		refetch,
	} = useStatsVideoPlays( statsParams, { maxRows: max } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;

	const rows = useMemo( () => toVideoPlaysRows( comparisonRows?.rows ?? [] ), [ comparisonRows ] );
	const detailSearch = useMemo( () => pickReportDateParams( reportParams ), [ reportParams ] );

	const chartData = useMemo(
		() => buildLeaderboardData( rows, detailSearch ),
		[ rows, detailSearch ]
	);

	return (
		<WidgetState
			isLoading={ isInitialLoading }
			isFetching={ isFetching }
			// The Stats queries carry `placeholderData`, so a failed range change keeps
			// the prior period's rows visible; only surface the error when there is
			// nothing to show.
			isError={ rows.length === 0 && isError }
			isEmpty={ rows.length === 0 }
			error={ {
				description: __(
					"We couldn't load video plays. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: video,
				description: __( 'No VideoPress plays in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison }
				withOverlayLabel
				showLegend={ false }
				dataFormat={ {
					type: 'number',
					options: { useMultipliers: true, decimals: 0 },
				} }
			/>
		</WidgetState>
	);
}

/**
 * VideoPress widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them.
 *
 * @param {VideoPressWidgetProps} props - The widget render props.
 * @return The rendered VideoPress widget.
 */
export default function VideoPress( { attributes = {}, setError }: VideoPressWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<div className={ styles.root }>
				<div className={ styles.content }>
					<VideoPressReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
				</div>
				<WidgetFooter>
					<ReportLink report="videos" />
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
