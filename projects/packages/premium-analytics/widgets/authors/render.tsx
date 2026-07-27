/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	ReportLink,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	formatLegendLabels,
	safeHttpUrl,
	toMaxRows,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LegendLabels,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo } from 'react';
import { postAuthor } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { buildTopAuthorsData, type AuthorLeaderboardRow } from './build-top-authors-data';
import styles from './style.module.css';
import type { AuthorsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const DEFAULT_MAX = 7;

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AuthorsRenderAttributes = AuthorsAttributes & Partial< ReportParamsFieldAttributes >;

type AuthorsWidgetProps = WidgetRenderProps< AuthorsRenderAttributes >;

export type AuthorsLeaderboardProps = {
	/**
	 * Author rows to render, already built from the top-authors report. Each row
	 * carries its avatar and posts so the leaderboard can show a name + picture
	 * label and drill down into that author's posts on click.
	 * When omitted, the empty state is shown (unless `isLoading` is set).
	 */
	rows?: AuthorLeaderboardRow[];
	/**
	 * When `true`, the first fetch is in flight and there is no data to show yet.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, a background refetch is in flight while data is shown.
	 */
	isFetching?: boolean;
	/**
	 * When `true`, the error state is rendered instead of the chart.
	 */
	isError?: boolean;
	/**
	 * Re-runs the failed query from the error state's Retry action.
	 */
	refetch?: () => void;
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
 * primitives via the toolkit's `LeaderboardChart` / `LeaderboardRow`; only the
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
	isFetching = false,
	isError = false,
	refetch,
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

	// Clear the stored selection only once data has settled without the
	// author — an in-flight load or refetch must not wipe a valid selection
	// while rows are briefly empty or stale (see WOOA7S-1666).
	useEffect( () => {
		if ( selectedAuthorId && ! selectedAuthor && ! isLoading && ! isFetching ) {
			clearSelectedAuthor();
		}
	}, [ selectedAuthorId, selectedAuthor, isLoading, isFetching, clearSelectedAuthor ] );

	const chartData: LeaderboardChartData = useMemo( () => {
		// Drilled-in: show the selected author's posts. Rows are not interactive;
		// the data layer already aligned current/comparison values, including
		// posts that only existed in the comparison period.
		if ( selectedAuthor ) {
			return selectedAuthor.posts.map( post => {
				// Post permalinks come from report data, so validate the scheme
				// before the row becomes a link.
				const postHref = safeHttpUrl( post.link );

				return {
					id: post.id,
					...buildLeaderboardRow( {
						label: post.title,
						media: { kind: 'none' },
						action: postHref ? { kind: 'link', href: postHref } : { kind: 'static' },
					} ),
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
			...buildLeaderboardRow( {
				label: row.label,
				media: { kind: 'avatar', url: row.avatarUrl ?? undefined, name: row.label },
				action:
					row.posts.length > 0
						? {
								kind: 'drillDown',
								onClick: () => selectAuthor( row.id ),
								ariaLabel: sprintf(
									/* translators: %s is the author name */
									__( 'View posts by %s', 'jetpack-premium-analytics-pkg' ),
									row.label
								),
						  }
						: { kind: 'static' },
			} ),
			currentValue: row.currentValue,
			previousValue: row.previousValue,
			currentShare: row.currentShare,
			previousShare: row.previousShare,
			delta: row.delta,
		} ) );
	}, [ rows, selectedAuthor, selectAuthor ] );

	const isDrilled = Boolean( selectedAuthor );

	return (
		<div className={ styles.content }>
			{ selectedAuthor && (
				<WidgetBackLink
					label={ __( 'All authors', 'jetpack-premium-analytics-pkg' ) }
					onClick={ clearSelectedAuthor }
				/>
			) }
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ chartData.length === 0 }
				error={ {
					description: __(
						"We couldn't load authors. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: refetch
						? [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ]
						: undefined,
				} }
				empty={ {
					icon: postAuthor,
					description: isDrilled
						? __(
								'This author has no posts with views for the selected period.',
								'jetpack-premium-analytics-pkg'
						  )
						: __( 'No author views in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
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
				/>
			</WidgetState>
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
		refetch,
	} = useStatsTopAuthors( statsParams, { maxRows: max } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;

	const rows = useMemo(
		() => buildTopAuthorsData( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	return (
		<>
			<AuthorsLeaderboard
				rows={ rows }
				isLoading={ isInitialLoading }
				isFetching={ isFetching }
				// The Stats queries carry `placeholderData: previousData => previousData`, so a
				// failed range change keeps the prior period's rows while `isError` flips true.
				// Only surface the error when there's nothing to show, so a transient refetch
				// failure doesn't replace populated rows with the error state.
				isError={ rows.length === 0 && isError }
				refetch={ refetch }
				withComparison={ hasComparison }
				legendLabels={ legendLabels }
			/>
			<WidgetFooter>
				<ReportLink report="authors" />
			</WidgetFooter>
		</>
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
export default function Authors( { attributes = {} }: AuthorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<AuthorsReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
			</div>
		</WidgetRoot>
	);
}
