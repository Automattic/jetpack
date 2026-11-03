/**
 * External dependencies
 */
import { toAuthorId } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardPostLabel,
	LeaderboardSkeleton,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	WidgetState,
	authorPostsCsvExporter,
	describeError,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useAuthorTopPosts from './use-author-top-posts';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes. `Record< never, never >` so the render-only type
 * can compose host fields such as `reportParams` without collapsing to `never`.
 */
export type AuthorTopPostsAttributes = Record< never, never >;

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

	const { rows, authorName, isLoading, isFetching, isError, error, hasData, refetch } =
		useAuthorTopPosts( authorId, reportParams, WIDGET_ROW_LIMIT );

	const csvExporter = useMemo(
		() => authorPostsCsvExporter( authorId, authorName ),
		[ authorId, authorName ]
	);

	const chartData = useMemo< LeaderboardChartData >(
		() =>
			rows.map( row => ( {
				id: row.id,
				label: (
					<LeaderboardPostLabel
						id={ row.postId }
						label={ row.title }
						link={ row.link }
						origin={ { report: 'authors' } }
					/>
				),
				currentValue: row.views,
			} ) ),
		[ rows ]
	);

	useReportActions( {
		csv: {
			exporter: csvExporter,
			status: { isLoading, isFetching, isError: ! hasData && isError },
			rowCount: rows.length,
		},
	} );

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// Stale rows stay on screen through a failed background refetch.
				isError={ ! hasData && isError }
				isEmpty={ rows.length === 0 }
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
								description: __(
									'Open an author to see their top posts here.',
									'jetpack-premium-analytics-pkg'
								),
							}
						: undefined
				}
				renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			>
				<LeaderboardChart
					chartTitle={ __( 'Top viewed posts', 'jetpack-premium-analytics-pkg' ) }
					data={ chartData }
					withOverlayLabel
					showLegend={ false }
					dataFormat={ DATA_FORMAT }
					columns={ { label: __( 'Posts', 'jetpack-premium-analytics-pkg' ), metric: 'views' } }
				/>
			</WidgetState>
		</div>
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
