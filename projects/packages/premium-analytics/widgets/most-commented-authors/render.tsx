/**
 * External dependencies
 */
import { useStatsCommentsRows } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	ReportLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	describeError,
	sharePercentage,
	toMaxRows,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { commentAuthorAvatar } from '@wordpress/icons';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type MostCommentedAuthorsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type MostCommentedAuthorsRenderAttributes = MostCommentedAuthorsAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostCommentedAuthorsWidgetProps = WidgetRenderProps< MostCommentedAuthorsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const DEFAULT_MAX = 10;

interface MostCommentedAuthorsInnerProps {
	/**
	 * Maximum number of rows to display. `0` means all rows.
	 */
	max: number;
}

/**
 * Most commented authors inner component. The comment counts come from the
 * all-time `stats/comments` report, so there is no date range or comparison
 * period to read from context.
 *
 * @param {MostCommentedAuthorsInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function MostCommentedAuthorsInner( { max }: MostCommentedAuthorsInnerProps ) {
	const { rows, isLoading, isFetching, isError, error, refetch } = useStatsCommentsRows( {
		group: 'authors',
		max,
	} );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...rows.map( row => row.value ), 0 );

		return rows.map( row => ( {
			id: row.id,
			// The author link is constructed locally by the data layer (a relative
			// `edit-comments.php?s=…` search), so it needs no scheme guard — which
			// would reject it as relative anyway.
			...buildLeaderboardRow( {
				label: row.label,
				media: { kind: 'avatar', url: row.avatarUrl, name: row.label },
				action: row.link ? { kind: 'link', href: row.link } : { kind: 'static' },
			} ),
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
							"We couldn't load comment authors. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={ {
						icon: commentAuthorAvatar,
						description: __(
							'No one has commented on your site yet.',
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
					section="authors"
					ariaLabel={ __( 'See the comment authors report', 'jetpack-premium-analytics-pkg' ) }
				/>
			</WidgetFooter>
		</Stack>
	);
}

/**
 * Most commented authors widget: the people who comment the most on the site,
 * ranked by comment count. Each row links to the comment management screen
 * filtered to that author when the report reports an email for them.
 *
 * One half of the Jetpack Stats "Comments" module; `jpa/most-commented-posts`
 * covers the other. Both read the same `stats/comments` response through
 * `useStatsCommentsRows`, so showing both costs a single request.
 *
 * @param {MostCommentedAuthorsWidgetProps} props - The widget render props.
 * @return The rendered Most commented authors widget.
 */
export default function MostCommentedAuthors( {
	attributes = {},
}: MostCommentedAuthorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostCommentedAuthorsInner max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
