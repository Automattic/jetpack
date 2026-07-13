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
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import { Link, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useCommentViews, { type CommentRow, type CommentView } from './use-comment-views';
import { type CommentsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ReactElement } from 'react';

type CommentsRenderAttributes = CommentsAttributes & Partial< ReportParamsFieldAttributes >;
type CommentsWidgetProps = WidgetRenderProps< CommentsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const COMMENT_VIEWS: CommentView[] = [ 'authors', 'posts' ];

function isCommentView( value: unknown ): value is CommentView {
	return typeof value === 'string' && COMMENT_VIEWS.includes( value as CommentView );
}

function viewOptionClass( active: boolean ): string {
	return active ? `${ styles.viewOption } ${ styles.viewOptionActive }` : styles.viewOption;
}

/**
 * Builds a leaderboard row label. Authors render as a name + avatar; posts render
 * as an external link to the published post (or plain text when a post has no
 * permalink). Author rows carry no link in the normalized data, so they are
 * always static labels.
 *
 * @param {CommentRow}  row  - The row to label.
 * @param {CommentView} view - The active view.
 * @return The label node.
 */
function buildRowLabel( row: CommentRow, view: CommentView ): ReactElement {
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
	 * The view the widget opens on.
	 */
	initialView: CommentView;
}

/**
 * Comments widget inner component. The comment counts come from the all-time
 * `stats/comments` report, so there is no date range or comparison period to
 * read from context; the view selector switches between the two groups the
 * report returns.
 *
 * @param {CommentsInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function CommentsInner( { max = 10, initialView }: CommentsInnerProps ) {
	const [ view, setView ] = useState< CommentView >( initialView );

	const { data, isLoading, isFetching, isError, refetch } = useCommentViews( { view, max } );

	const selectAuthors = useCallback( () => setView( 'authors' ), [] );
	const selectPosts = useCallback( () => setView( 'posts' ), [] );

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
			<div
				className={ styles.viewControl }
				role="group"
				aria-label={ __( 'Comments view', 'jetpack-premium-analytics' ) }
			>
				<button
					type="button"
					className={ viewOptionClass( view === 'authors' ) }
					aria-pressed={ view === 'authors' }
					onClick={ selectAuthors }
				>
					{ __( 'By authors', 'jetpack-premium-analytics' ) }
				</button>
				<button
					type="button"
					className={ viewOptionClass( view === 'posts' ) }
					aria-pressed={ view === 'posts' }
					onClick={ selectPosts }
				>
					{ __( 'By posts & pages', 'jetpack-premium-analytics' ) }
				</button>
			</div>
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
 * pages, ranked by comment count and switchable through an in-widget view
 * selector. Ported from the Jetpack Stats "Comments" module.
 *
 * @param {CommentsWidgetProps} props - The widget render props.
 * @return The rendered Comments widget.
 */
export default function Comments( { attributes = {} }: CommentsWidgetProps ) {
	const initialView = isCommentView( attributes.view ) ? attributes.view : 'authors';

	return (
		<WidgetRoot attributes={ attributes }>
			<CommentsInner max={ attributes.max } initialView={ initialView } />
		</WidgetRoot>
	);
}
