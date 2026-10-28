/**
 * External dependencies
 */
import { useStatsCommentsRows } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardSkeleton,
	LeaderboardPostLabel,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	WidgetState,
	describeError,
	sharePercentage,
	commentsPostsCsvExporter,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type MostCommentedPostsAttributes = Record< never, never >;

type MostCommentedPostsRenderAttributes = MostCommentedPostsAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostCommentedPostsWidgetProps = WidgetRenderProps< MostCommentedPostsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * Counts come from the all-time `stats/comments` report, so there is no date
 * range or comparison period to read from context.
 */
function MostCommentedPostsInner() {
	const { rows, isLoading, isFetching, isError, error, refetch } = useStatsCommentsRows( {
		group: 'posts',
		max: WIDGET_ROW_LIMIT,
	} );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...rows.map( row => row.value ), 0 );

		return rows.map( row => ( {
			id: row.id,
			label: (
				<LeaderboardPostLabel
					id={ row.postId }
					label={ row.label }
					link={ row.link }
					origin={ { report: 'comments', section: 'posts' } }
				/>
			),
			currentValue: row.value,
			currentShare: sharePercentage( row.value, maxValue ),
		} ) );
	}, [ rows ] );

	useReportActions( {
		csv: {
			exporter: commentsPostsCsvExporter,
			status: { isLoading, isFetching, isError },
			rowCount: rows.length,
		},
	} );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ rows.length === 0 }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load commented posts. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={ {
						description: __(
							'You don’t have comments recorded yet.',
							'jetpack-premium-analytics-pkg'
						),
					} }
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<LeaderboardChart
						chartTitle={ __( 'All-time most commented posts', 'jetpack-premium-analytics-pkg' ) }
						data={ leaderboardData }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ DATA_FORMAT }
						columns={ {
							label: __( 'Posts', 'jetpack-premium-analytics-pkg' ),
							metric: 'comments',
						} }
					/>
				</WidgetState>
			</div>
		</Stack>
	);
}

/**
 * One half of the Jetpack Stats "Comments" module; `jpa/most-commented-authors`
 * covers the other. Both read the same `stats/comments` response through
 * `useStatsCommentsRows`, so showing both costs a single request.
 */
export default function MostCommentedPosts( { attributes = {} }: MostCommentedPostsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostCommentedPostsInner />
		</WidgetRoot>
	);
}
