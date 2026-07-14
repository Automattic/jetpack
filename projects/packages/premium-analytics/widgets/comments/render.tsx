/**
 * External dependencies
 */
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetRoot,
	WidgetState,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import { Link, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useCommentViews, { type CommentRow } from './use-comment-views';
import { type CommentsAttributes, type CommentsView } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ReactElement } from 'react';

type CommentsRenderAttributes = CommentsAttributes & Partial< ReportParamsFieldAttributes >;
type CommentsWidgetProps = WidgetRenderProps< CommentsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const COMMENT_VIEWS: CommentsView[] = [ 'authors', 'posts' ];

function isCommentView( value: unknown ): value is CommentsView {
	return typeof value === 'string' && COMMENT_VIEWS.includes( value as CommentsView );
}

/**
 * Builds a leaderboard row label. Authors render as a name + avatar; posts render
 * as an external link to the published post (or plain text when a post has no
 * permalink). Author rows carry no link in the normalized data, so they are
 * always static labels.
 *
 * @param {CommentRow}   row  - The row to label.
 * @param {CommentsView} view - The active view.
 * @return The label node.
 */
function buildRowLabel( row: CommentRow, view: CommentsView ): ReactElement {
	if ( view === 'authors' ) {
		return (
			<LeaderboardLabel
				label={ row.label }
				imageUrl={ row.avatarUrl }
				imageAlt={ sprintf(
					/* translators: %s is the comment author name */
					__( 'Avatar of %s', 'jetpack-premium-analytics' ),
					row.label
				) }
				imageClassName={ styles.avatar }
			/>
		);
	}

	if ( row.link ) {
		return (
			<Link
				className={ styles.postLabel }
				href={ row.link }
				variant="unstyled"
				openInNewTab
				title={ row.label }
			>
				{ row.label }
			</Link>
		);
	}

	return (
		<span className={ styles.postLabel } title={ row.label }>
			{ row.label }
		</span>
	);
}

interface CommentsInnerProps {
	/**
	 * Maximum number of rows to display.
	 */
	max?: number;
	/**
	 * The active view. Owned by the widget host: the `view` attribute is
	 * `relevance: 'high'`, so the host renders the "View by" header control.
	 */
	view: CommentsView;
}

/**
 * Comments widget inner component. The comment counts come from the all-time
 * `stats/comments` report, so there is no date range or comparison period to
 * read from context; the host-owned `view` selects which of the report's two
 * groups is shown.
 *
 * @param {CommentsInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function CommentsInner( { max = 10, view }: CommentsInnerProps ) {
	const { data, isLoading, isFetching, isError, refetch } = useCommentViews( { view, max } );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...data.map( row => row.value ), 0 );

		return data.map( row => ( {
			id: row.id,
			label: buildRowLabel( row, view ),
			currentValue: row.value,
			currentShare: maxValue > 0 ? ( row.value / maxValue ) * 100 : 0,
		} ) );
	}, [ data, view ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ {
						description: __(
							"We couldn't load comments. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: comment,
						description: __(
							'Learn about the comments your site receives by authors, posts, and pages.',
							'jetpack-premium-analytics'
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
		</Stack>
	);
}

/**
 * Comments widget: the site's comment authors and its most-commented posts and
 * pages, ranked by comment count. The active view is the host-rendered "View by"
 * header control (the `view` attribute). Ported from the Jetpack Stats
 * "Comments" module.
 *
 * @param {CommentsWidgetProps} props - The widget render props.
 * @return The rendered Comments widget.
 */
export default function Comments( { attributes = {} }: CommentsWidgetProps ) {
	const view = isCommentView( attributes.view ) ? attributes.view : 'authors';

	return (
		<WidgetRoot attributes={ attributes }>
			<CommentsInner max={ attributes.max } view={ view } />
		</WidgetRoot>
	);
}
