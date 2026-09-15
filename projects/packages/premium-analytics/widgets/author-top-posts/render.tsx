/**
 * External dependencies
 */
import { toAuthorId } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	LeaderboardChart,
	LeaderboardPostLabel,
	LeaderboardSkeleton,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	describeError,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useAuthorTopPosts from './use-author-top-posts';
import type { AuthorTopPostsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type AuthorTopPostsRenderAttributes = AuthorTopPostsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AuthorTopPostsWidgetProps = WidgetRenderProps< AuthorTopPostsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * Without an author scope (the widget added outside an author detail page) the
 * query never enables and the scopeless empty state shows.
 */
function AuthorTopPostsInner() {
	const { reportParams } = useWidgetRootContext();
	const authorId = toAuthorId( reportParams.author_id );

	const { rows, isLoading, isFetching, isError, error, hasData, refetch } = useAuthorTopPosts(
		authorId,
		reportParams,
		WIDGET_ROW_LIMIT
	);

	const chartData = useMemo< LeaderboardChartData >(
		() =>
			rows.map( row => ( {
				id: row.id,
				label: <LeaderboardPostLabel id={ row.postId } label={ row.title } link={ row.link } />,
				currentValue: row.views,
				currentShare: row.share,
			} ) ),
		[ rows ]
	);

	return (
		<>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// Stale rows stay on screen through a failed background refetch.
					isError={ ! hasData && isError }
					isEmpty={ authorId <= 0 || rows.length === 0 }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load this author's posts. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={
						authorId <= 0
							? {
									icon: reports,
									description: __(
										'Open an author to see their top posts here.',
										'jetpack-premium-analytics-pkg'
									),
							  }
							: {
									icon: postList,
									description: __(
										'No views recorded for this author’s posts in this period.',
										'jetpack-premium-analytics-pkg'
									),
							  }
					}
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<LeaderboardChart
						data={ chartData }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ DATA_FORMAT }
					/>
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="authors" />
			</WidgetFooter>
		</>
	);
}

export default function AuthorTopPosts( { attributes = {} }: AuthorTopPostsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<AuthorTopPostsInner />
			</div>
		</WidgetRoot>
	);
}
