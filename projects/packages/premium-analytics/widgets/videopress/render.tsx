/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardRow,
	LeaderboardSkeleton,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	calculateDelta,
	getCombinedPeriodMax,
	sharePercentage,
	useWidgetNavigationSearch,
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
import type { VideoPressAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget has no settings of its own.
type VideoPressRenderAttributes = VideoPressAttributes & Partial< ReportParamsFieldAttributes >;

type VideoPressWidgetProps = WidgetRenderProps< VideoPressRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Maps normalized video rows onto the shape `LeaderboardChart` expects. Shares
 * are computed against the largest value of either period so the overlay bars
 * stay proportional. Rows without a matching comparison-period value keep
 * comparison fields undefined so the chart suppresses fabricated deltas.
 */
function buildLeaderboardData(
	rows: VideoPlaysRow[],
	detailSearch: Record< string, unknown >
): LeaderboardChartData {
	const maxPlays = getCombinedPeriodMax(
		rows.map( row => row.plays ),
		rows.map( row => row.previousPlays )
	);

	return rows.map( row => ( {
		id: row.key,
		label: (
			<LeaderboardRow
				label={ row.label }
				media={ { kind: 'none' } }
				action={ { kind: 'videoLink', id: row.id, href: row.link, search: detailSearch } }
			/>
		),
		currentValue: row.plays,
		currentShare: sharePercentage( row.plays, maxPlays ),
		previousValue: row.previousPlays,
		previousShare:
			row.previousPlays !== undefined ? sharePercentage( row.previousPlays, maxPlays ) : undefined,
		delta:
			row.previousPlays !== undefined ? calculateDelta( row.plays, row.previousPlays ) : undefined,
	} ) );
}

/**
 * Fetches the video-plays report through the Jetpack Stats hook, builds the
 * leaderboard rows, and renders them through the shared widget content states.
 */
function VideoPressReport() {
	const { reportParams } = useWidgetRootContext();
	const detailSearch = useWidgetNavigationSearch();
	const statsParams = useMemo(
		() => ( { ...reportParams, max: WIDGET_ROW_LIMIT } ),
		[ reportParams ]
	);

	// The hook merges comparison rows in the data layer and gates
	// `hasComparison` on at least one visible row (`maxRows`) having a matching
	// comparison row, so the chart never fabricates vs-zero deltas.
	const { primary, comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsVideoPlays( statsParams, { maxRows: WIDGET_ROW_LIMIT } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = isLoading || primary.isPending;

	const rows = useMemo( () => toVideoPlaysRows( comparisonRows?.rows ?? [] ), [ comparisonRows ] );
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
			renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
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

export default function VideoPress( { attributes = {}, setError }: VideoPressWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<div className={ styles.root }>
				<div className={ styles.content }>
					<VideoPressReport />
				</div>
				<WidgetFooter>
					<ReportLink report="videos" />
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
