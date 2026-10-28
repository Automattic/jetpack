/**
 * External dependencies
 */
import { useStatsCommentsRows } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	describeError,
	commentsAuthorsCsvExporter,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type MostCommentedAuthorsAttributes = Record< never, never >;

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

	useReportActions( {
		csv: {
			exporter: commentsAuthorsCsvExporter,
			status: { isLoading, isFetching, isError },
			rowCount: rows.length,
		},
	} );

	return (
		<Leaderboard
			chartTitle={ __( 'All-time most commented authors', 'jetpack-premium-analytics-pkg' ) }
			rows={ leaderboardRows }
			columns={ { label: __( 'Authors', 'jetpack-premium-analytics-pkg' ), metric: 'comments' } }
			status={ { isLoading, isFetching, isError, refetch } }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load comment authors. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				description: __( 'You don’t have comments recorded yet.', 'jetpack-premium-analytics-pkg' ),
			} }
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
