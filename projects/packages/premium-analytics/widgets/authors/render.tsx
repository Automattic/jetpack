/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetBackLink,
	WidgetLoadingOverlay,
	WidgetRoot,
	formatLegendLabels,
	useWidgetDrillDown,
	useWidgetError,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LegendLabels,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useEffect, useMemo } from 'react';
import { postAuthor } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { buildTopAuthorsData, type AuthorLeaderboardRow } from './build-top-authors-data';
import styles from './style.module.css';
import type { AuthorsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

const DEFAULT_MAX = 7;

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AuthorsRenderAttributes = AuthorsAttributes & Partial< ReportParamsFieldAttributes >;

type AuthorsWidgetProps = WidgetRenderProps< AuthorsRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const toPositiveInt = ( value: string | number | undefined, fallback: number ) => {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed > 0 ? parsed : fallback;
};

export type AuthorsLeaderboardProps = {
	/**
	 * Author rows to render, already built from the top-authors report. Each row
	 * carries its avatar and posts so the leaderboard can show a name + picture
	 * label and drill down into that author's posts on click.
	 * When omitted, the empty state is shown (unless `isLoading` is set).
	 */
	rows?: AuthorLeaderboardRow[];
	/**
	 * When `true`, the initial loading overlay is rendered instead of the chart.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, a loading overlay is layered over the chart while data
	 * refetches in the background.
	 */
	isRefetching?: boolean;
	/**
	 * When `true`, render each row's previous-period delta next to its value.
	 */
	withComparison?: boolean;
	/**
	 * Custom legend labels for the current/comparison periods.
	 */
	legendLabels?: LegendLabels;
};

/**
 * Presentational leaderboard for the Authors widget. Renders the site's top
 * authors by views — each row labelled with the author's name and avatar — and
 * lets a click drill down into that author's posts, with a back link to return.
 *
 * Both the interactive row affordance (chevron, hover, keyboard access) and the
 * name + picture label come from the shared `@automattic/charts` leaderboard
 * primitives via the toolkit's `LeaderboardChart` / `LeaderboardLabel`; only the
 * drill-down navigation state lives here.
 *
 * Takes already-built rows via props (and is exported) so Storybook can
 * exercise these states — including the drill-down — with fixture data; there
 * is no Stats backend in Storybook, so the data-connected entry point would
 * only ever show chrome.
 *
 * @param {AuthorsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export function AuthorsLeaderboard( {
	rows = [],
	isLoading = false,
	isRefetching = false,
	withComparison = false,
	legendLabels,
}: AuthorsLeaderboardProps ) {
	// Store only the author id and resolve the row fresh from the current rows,
	// so a background refetch that drops the author cleanly falls back to the
	// top view instead of pinning a stale snapshot.
	const {
		drillDownItem: selectedAuthorId,
		drillDown: selectAuthor,
		resetDrillDown: clearSelectedAuthor,
	} = useWidgetDrillDown< string >();

	const selectedAuthor = useMemo(
		() => ( selectedAuthorId ? rows.find( row => row.id === selectedAuthorId ) ?? null : null ),
		[ rows, selectedAuthorId ]
	);

	useEffect( () => {
		if ( selectedAuthorId && ! selectedAuthor ) {
			clearSelectedAuthor();
		}
	}, [ selectedAuthorId, selectedAuthor, clearSelectedAuthor ] );

	const chartData: LeaderboardChartData = useMemo( () => {
		// Drilled-in: show the selected author's posts. Rows are not interactive;
		// the data layer already aligned current/comparison values, including
		// posts that only existed in the comparison period.
		if ( selectedAuthor ) {
			return selectedAuthor.posts.map( post => {
				// A custom label element bypasses the chart's default overlay
				// `.label` inset, so mirror top-posts: pad the block (sets the bar
				// height, since there is no avatar to size the row) and inset the
				// text from the bar's rounded left edge.
				const label = post.link ? (
					<Link
						className={ styles.postLabel }
						href={ post.link }
						variant="unstyled"
						openInNewTab
						title={ post.title }
					>
						{ post.title }
					</Link>
				) : (
					<span className={ styles.postLabel } title={ post.title }>
						{ post.title }
					</span>
				);

				return {
					id: post.id,
					label,
					currentValue: post.currentValue,
					previousValue: post.previousValue,
					currentShare: post.currentShare,
					previousShare: post.previousShare,
					delta: post.delta,
				};
			} );
		}

		// Top authors: name + avatar label, and a click drills into the author's
		// posts. Authors without posts stay inert (no onClick).
		return rows.map( row => ( {
			id: row.id,
			label: (
				<LeaderboardLabel
					label={ row.label }
					imageUrl={ row.avatarUrl ?? undefined }
					imageAlt={ sprintf(
						/* translators: %s is the author name */
						__( 'Avatar of %s', 'jetpack-premium-analytics' ),
						row.label
					) }
					imageClassName={ styles.avatar }
				/>
			),
			currentValue: row.currentValue,
			previousValue: row.previousValue,
			currentShare: row.currentShare,
			previousShare: row.previousShare,
			delta: row.delta,
			...( row.posts.length > 0 && {
				onClick: () => selectAuthor( row.id ),
				// The label already renders the name as text; without an explicit
				// action name the button would announce the avatar alt ("Avatar of
				// X") plus the name. Give it a concise, deterministic name instead.
				ariaLabel: sprintf(
					/* translators: %s is the author name */
					__( 'View posts by %s', 'jetpack-premium-analytics' ),
					row.label
				),
			} ),
		} ) );
	}, [ rows, selectedAuthor, selectAuthor ] );

	if ( isLoading ) {
		return (
			<div className={ styles.content }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	const isDrilled = Boolean( selectedAuthor );

	return (
		<div className={ styles.content }>
			{ selectedAuthor && (
				<WidgetBackLink
					label={ __( 'All authors', 'jetpack-premium-analytics' ) }
					onClick={ clearSelectedAuthor }
				/>
			) }
			<LeaderboardChart
				data={ chartData }
				withComparison={ withComparison }
				withOverlayLabel
				showLegend={ false }
				legendLabels={ legendLabels }
				dataFormat={ {
					type: 'number',
					options: { useMultipliers: true, decimals: 0 },
				} }
				emptyStateIcon={ postAuthor }
				emptyStateText={
					isDrilled
						? __(
								'This author has no posts with views for the selected period.',
								'jetpack-premium-analytics'
						  )
						: __(
								'Learn about your most popular authors to better understand how they contribute to growing your site.',
								'jetpack-premium-analytics'
						  )
				}
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</div>
	);
}

type AuthorsReportProps = {
	/**
	 * Maximum number of authors to display.
	 */
	max: number;
};

/**
 * Fetches the top-authors report through the Jetpack Stats hook, builds the
 * leaderboard rows from the data layer's merged comparison rows, and hands
 * them to the presentational `AuthorsLeaderboard`.
 *
 * @param {AuthorsReportProps} props - The component props.
 * @return The widget content.
 */
function AuthorsReport( { max }: AuthorsReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo( () => ( { ...reportParams, max } ), [ reportParams, max ] );

	const {
		primary,
		comparisonRows,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useStatsTopAuthors( statsParams, { maxRows: max } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;
	const isRefetching = isFetching && hasData;

	const rows = useMemo(
		() => buildTopAuthorsData( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	return (
		<AuthorsLeaderboard
			rows={ rows }
			isLoading={ isInitialLoading }
			isRefetching={ isRefetching }
			withComparison={ hasComparison }
			legendLabels={ legendLabels }
		/>
	);
}

/**
 * Authors widget render entry point.
 *
 * Passes host `attributes` into `WidgetRoot`, which resolves the report params:
 * the dashboard leaves `reportParams` out of `attributes`, so it falls back to
 * the date-range URL search params the picker writes to; Storybook injects
 * `attributes.reportParams` directly. The widget's own `max` is forwarded to
 * the inner component.
 *
 * @param {AuthorsWidgetProps} props - The widget render props.
 * @return The rendered Authors widget.
 */
export default function Authors( { attributes = {}, setError }: AuthorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<div className={ styles.root }>
				<AuthorsReport max={ toPositiveInt( attributes.max, DEFAULT_MAX ) } />
			</div>
		</WidgetRoot>
	);
}
