/**
 * External dependencies
 */
import { useStatsCommentsRows } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardPostLabel,
	ReportLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	describeError,
	sharePercentage,
	toMaxRows,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { commentContent } from '@wordpress/icons';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type MostCommentedPostsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type MostCommentedPostsRenderAttributes = MostCommentedPostsAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostCommentedPostsWidgetProps = WidgetRenderProps< MostCommentedPostsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const DEFAULT_MAX = 10;

interface MostCommentedPostsInnerProps {
	/**
	 * Maximum number of rows to display. `0` means all rows.
	 */
	max: number;
}

/**
 * Most commented posts inner component. The comment counts come from the
 * all-time `stats/comments` report, so there is no date range or comparison
 * period to read from context.
 *
 * @param {MostCommentedPostsInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function MostCommentedPostsInner( { max }: MostCommentedPostsInnerProps ) {
	const { rows, isLoading, isFetching, isError, error, refetch } = useStatsCommentsRows( {
		group: 'posts',
		max,
	} );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...rows.map( row => row.value ), 0 );

		return rows.map( row => ( {
			id: row.id,
			label: <LeaderboardPostLabel id={ row.postId } label={ row.label } link={ row.link } />,
			currentValue: row.value,
			currentShare: sharePercentage( row.value, maxValue ),
		} ) );
	}, [ rows ] );

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
						icon: commentContent,
						description: __(
							'None of your posts or pages have comments yet.',
							'jetpack-premium-analytics-pkg'
						),
					} }
				>
					<LeaderboardChart
						data={ leaderboardData }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ DATA_FORMAT }
					/>
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink
					report="comments"
					section="posts"
					ariaLabel={ __( 'See the commented posts report', 'jetpack-premium-analytics-pkg' ) }
				/>
			</WidgetFooter>
		</Stack>
	);
}

/**
 * Most commented posts widget: the posts and pages that receive the most
 * comments, ranked by comment count. Each row opens the post detail page, and
 * falls back to the published post when the report carries no post ID.
 *
 * One half of the Jetpack Stats "Comments" module; `jpa/most-commented-authors`
 * covers the other. Both read the same `stats/comments` response through
 * `useStatsCommentsRows`, so showing both costs a single request.
 *
 * @param {MostCommentedPostsWidgetProps} props - The widget render props.
 * @return The rendered Most commented posts widget.
 */
export default function MostCommentedPosts( { attributes = {} }: MostCommentedPostsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostCommentedPostsInner max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
