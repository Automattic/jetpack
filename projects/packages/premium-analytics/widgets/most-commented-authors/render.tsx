/**
 * External dependencies
 */
import { useStatsCommentsRows } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	describeError,
	ExporterCsvDownloadButton,
	commentsAuthorsCsvExporter,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { commentAuthorAvatar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { type MostCommentedAuthorsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type MostCommentedAuthorsRenderAttributes = MostCommentedAuthorsAttributes &
	Partial< ReportParamsFieldAttributes >;

type MostCommentedAuthorsWidgetProps = WidgetRenderProps< MostCommentedAuthorsRenderAttributes >;

/**
 * Counts come from the all-time `stats/comments` report, so there is no date
 * range or comparison period to read from context.
 */
function MostCommentedAuthorsInner() {
	const { rows, isLoading, isFetching, isError, error, refetch } = useStatsCommentsRows( {
		group: 'authors',
		max: WIDGET_ROW_LIMIT,
	} );

	const leaderboardRows = useMemo< LeaderboardRowInput[] >(
		() =>
			rows.map( row => ( {
				id: row.id,
				label: row.label,
				value: row.value,
				media: { kind: 'avatar', url: row.avatarUrl, name: row.label },
				// The author link is constructed locally by the data layer (a relative
				// `edit-comments.php` filter), so it needs no scheme guard — which
				// would reject it as relative anyway.
				action: row.link ? { kind: 'link', href: row.link } : { kind: 'static' },
			} ) ),
		[ rows ]
	);

	return (
		<Leaderboard
			rows={ leaderboardRows }
			status={ { isLoading, isFetching, isError, refetch } }
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
			footer={
				<>
					<ReportLink
						report="comments"
						section="authors"
						ariaLabel={ __( 'See the comment authors report', 'jetpack-premium-analytics-pkg' ) }
					/>
					<ExporterCsvDownloadButton
						exporter={ commentsAuthorsCsvExporter }
						status={ { isLoading, isFetching, isError } }
						rowCount={ rows.length }
					/>
				</>
			}
		/>
	);
}

/**
 * One half of the Jetpack Stats "Comments" module; `jpa/most-commented-posts`
 * covers the other. Both read the same `stats/comments` response through
 * `useStatsCommentsRows`, so showing both costs a single request.
 */
export default function MostCommentedAuthors( {
	attributes = {},
}: MostCommentedAuthorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostCommentedAuthorsInner />
		</WidgetRoot>
	);
}
