/**
 * External dependencies
 */
import {
	useStatsComments,
	type StatsCommentsAuthorItem,
	type StatsCommentsGroupItem,
	type StatsCommentsItem,
	type StatsCommentsPostItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetLoadingOverlay,
	WidgetRoot,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
/**
 * Internal dependencies
 */
import styles from './comments.module.css';
import { type CommentsAttributes, type CommentsView } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The Stats comments endpoint is date-range agnostic, so the widget does not
// read `reportParams`; host attributes still flow into `WidgetRoot` so the
// dashboard date picker and comparison controls stay consistent with the rest
// of the dashboard.
type CommentsRenderAttributes = CommentsAttributes & Partial< ReportParamsFieldAttributes >;

const DEFAULT_MAX = 10;

/**
 * Apply the widget's `max` setting, treating `0` as "all rows".
 *
 * @param items - The rows to trim.
 * @param max   - Maximum rows, or `0` for all.
 * @return The trimmed rows.
 */
function limitRows< T >( items: T[], max: number ): T[] {
	return items.slice( 0, max > 0 ? max : undefined );
}

/**
 * Build the leaderboard rows for the comment authors view. Each row shows the
 * author's avatar and their comment count. This module has no comparison period,
 * so the previous-period fields are zeroed and the chart's comparison UI stays
 * off.
 *
 * @param authors - The normalized author rows.
 * @param max     - Maximum rows, or `0` for all.
 * @return The leaderboard chart data.
 */
function buildAuthorRows( authors: StatsCommentsAuthorItem[], max: number ): LeaderboardChartData {
	const rows = limitRows( authors, max );
	const maxValue = Math.max( ...rows.map( author => author.value ), 1 );

	return rows.map( ( author, index ) => {
		const label = String( author.label ?? '' );

		return {
			id: `${ index }-${ label }`,
			label: (
				<div className={ styles.authorLabel }>
					<LeaderboardLabel
						label={ label }
						imageUrl={ author.icon ?? undefined }
						imageClassName={ styles.avatar }
					/>
				</div>
			),
			currentValue: author.value,
			currentShare: ( author.value / maxValue ) * 100,
			previousValue: 0,
			previousShare: 0,
			delta: 0,
		};
	} );
}

/**
 * Build the leaderboard rows for the most-commented posts view. Rows with a link
 * open the post in a new tab; the rest render as plain labels. This module has no
 * comparison period, so the previous-period fields are zeroed.
 *
 * @param posts - The normalized post rows.
 * @param max   - Maximum rows, or `0` for all.
 * @return The leaderboard chart data.
 */
function buildPostRows( posts: StatsCommentsPostItem[], max: number ): LeaderboardChartData {
	const rows = limitRows( posts, max );
	const maxValue = Math.max( ...rows.map( post => post.value ), 1 );

	return rows.map( ( post, index ) => {
		const title = String( post.label ?? '' );

		return {
			id: `${ index }-${ post.link ?? title }`,
			label: post.link ? (
				<Link
					className={ styles.postLink }
					href={ post.link }
					variant="unstyled"
					openInNewTab
					title={ title }
				>
					{ title }
				</Link>
			) : (
				<Text className={ styles.postLabel } title={ title }>
					{ title }
				</Text>
			),
			currentValue: post.value,
			currentShare: ( post.value / maxValue ) * 100,
			previousValue: 0,
			previousShare: 0,
			delta: 0,
		};
	} );
}

/**
 * Find a comment group (authors or posts) in the normalized report.
 *
 * @param groups - The report's top-level group rows.
 * @param view   - The group to find.
 * @return The matching group, or undefined when absent.
 */
function findGroup(
	groups: StatsCommentsItem[],
	view: CommentsView
): StatsCommentsGroupItem | undefined {
	return groups.find(
		( group ): group is StatsCommentsGroupItem =>
			'children' in group && Array.isArray( group.children ) && group.label === view
	);
}

const TABS: { id: CommentsView; label: string }[] = [
	{ id: 'authors', label: __( 'Authors', 'jetpack-premium-analytics' ) },
	{ id: 'posts', label: __( 'Posts', 'jetpack-premium-analytics' ) },
];

const EMPTY_TEXT: Record< CommentsView, string > = {
	authors: __( 'Your most active comment authors will appear here.', 'jetpack-premium-analytics' ),
	posts: __( 'Your most commented posts will appear here.', 'jetpack-premium-analytics' ),
};

/**
 * Comments widget inner component. Fetches the Stats comments report and renders
 * the selected leaderboard behind an Authors/Posts toggle.
 *
 * @param props             - Component props.
 * @param props.max         - Maximum rows to display, or `0` for all.
 * @param props.initialView - Leaderboard shown before the user toggles.
 * @return The rendered widget content.
 */
function CommentsInner( { max, initialView }: { max: number; initialView: CommentsView } ) {
	const [ view, setView ] = useState< CommentsView >( initialView );
	const { data, isLoading, isError } = useStatsComments();

	const groups = useMemo( () => data?.data?.[ 0 ]?.items ?? [], [ data ] );
	const hasAnyData = groups.some(
		group => 'children' in group && ( group.children?.length ?? 0 ) > 0
	);

	const rows = useMemo( (): LeaderboardChartData => {
		const group = findGroup( groups, view );
		const children = group?.children ?? [];

		return view === 'authors'
			? buildAuthorRows( children as StatsCommentsAuthorItem[], max )
			: buildPostRows( children as StatsCommentsPostItem[], max );
	}, [ groups, view, max ] );

	const handleTabClick = useCallback( ( event: MouseEvent< HTMLButtonElement > ) => {
		setView( event.currentTarget.dataset.view as CommentsView );
	}, [] );

	const header = (
		<div
			className={ styles.tabs }
			role="tablist"
			aria-label={ __( 'View comments by', 'jetpack-premium-analytics' ) }
		>
			{ TABS.map( tab => (
				<button
					key={ tab.id }
					type="button"
					role="tab"
					aria-selected={ view === tab.id }
					data-view={ tab.id }
					className={ clsx( styles.tab, view === tab.id && styles.tabActive ) }
					onClick={ handleTabClick }
				>
					{ tab.label }
				</button>
			) ) }
		</div>
	);

	return (
		<>
			{ header }
			<div className={ styles.content }>
				{ isLoading && ! hasAnyData && <WidgetLoadingOverlay /> }
				{ isError && ! hasAnyData ? (
					<Stack align="center" justify="center" className={ styles.placeholder }>
						<Text>{ __( 'Could not load comments data.', 'jetpack-premium-analytics' ) }</Text>
					</Stack>
				) : (
					<LeaderboardChart
						data={ rows }
						loading={ isLoading }
						withOverlayLabel
						showLegend={ false }
						emptyStateText={ EMPTY_TEXT[ view ] }
						dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
						className={ styles.leaderboard }
					/>
				) }
			</div>
		</>
	);
}

/**
 * Comments widget: the site's most active comment authors and most commented
 * posts, behind an Authors/Posts toggle. Ported from the Jetpack Stats "Comments"
 * module. The endpoint has no date range or comparison period, so the widget
 * renders the same regardless of the dashboard date picker.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes (max, initialView).
 * @return The rendered Comments widget.
 */
export default function Comments( {
	attributes = {},
}: WidgetRenderProps< CommentsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<CommentsInner
					max={ attributes.max ?? DEFAULT_MAX }
					initialView={ attributes.initialView ?? 'authors' }
				/>
			</div>
		</WidgetRoot>
	);
}
