/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	authorDetailLinkProps,
	LeaderboardSkeleton,
	LeaderboardPostLabel,
	WIDGET_ROW_LIMIT,
	WidgetBackLink,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	formatLegendLabels,
	useWidgetDrillDown,
	useWidgetRootContext,
	authorsCsvExporter,
	type LeaderboardChartData,
	type WidgetStateEmpty,
	type LegendLabels,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildTopAuthorsData, type AuthorLeaderboardRow } from './build-top-authors-data';
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type AuthorsAttributes = Record< never, never >;

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AuthorsRenderAttributes = AuthorsAttributes & Partial< ReportParamsFieldAttributes >;

type AuthorsWidgetProps = WidgetRenderProps< AuthorsRenderAttributes >;

export type AuthorsLeaderboardProps = {
	rows?: AuthorLeaderboardRow[];
	isLoading?: boolean;
	isFetching?: boolean;
	isError?: boolean;
	refetch?: () => void;
	withComparison?: boolean;
	legendLabels?: LegendLabels;
	empty?: WidgetStateEmpty;
};

/**
 * Takes already-built rows via props, and is exported, so Storybook can exercise
 * every state including the drill-down: there is no Stats backend there, so the
 * data-connected entry point would only ever show chrome.
 */
export function AuthorsLeaderboard( {
	rows = [],
	isLoading = false,
	isFetching = false,
	isError = false,
	refetch,
	withComparison = false,
	legendLabels,
	empty,
}: AuthorsLeaderboardProps ) {
	// Store only the id and resolve the row fresh, so a refetch that drops the
	// author falls back to the top view instead of pinning a stale snapshot.
	const {
		drillDownItem: selectedAuthorId,
		drillDown: selectAuthor,
		resetDrillDown: clearSelectedAuthor,
	} = useWidgetDrillDown< string >();

	const selectedAuthor = useMemo(
		() => ( selectedAuthorId ? ( rows.find( row => row.id === selectedAuthorId ) ?? null ) : null ),
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
		// The data layer already aligned current/comparison values.
		if ( selectedAuthor ) {
			return selectedAuthor.posts.map( post => ( {
				id: post.id,
				label: (
					<LeaderboardPostLabel
						id={ post.postId }
						label={ post.title }
						link={ post.link }
						origin={ { report: 'authors' } }
					/>
				),
				currentValue: post.currentValue,
				previousValue: post.previousValue,
				currentShare: post.currentShare,
				previousShare: post.previousShare,
				delta: post.delta,
			} ) );
		}

		return rows.map( row => {
			const authorLink = row.authorId ? authorDetailLinkProps( row.authorId ) : undefined;

			return {
				id: row.id,
				...buildLeaderboardRow( {
					label: row.label,
					media: { kind: 'avatar', url: row.avatarUrl ?? undefined, name: row.label },
					action:
						row.posts.length > 0
							? {
									kind: 'drillDown',
									onClick: () => selectAuthor( row.id ),
									// The name opens the author's page; the rest of the row lists their posts.
									link: authorLink,
									ariaLabel: sprintf(
										/* translators: %s is the author name */
										__( 'View posts by %s', 'jetpack-premium-analytics-pkg' ),
										row.label
									),
								}
							: { kind: 'static', link: authorLink },
				} ),
				currentValue: row.currentValue,
				previousValue: row.previousValue,
				currentShare: row.currentShare,
				previousShare: row.previousShare,
				delta: row.delta,
			};
		} );
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
				// The author row the reader drilled from had views, so "no results" would contradict it; say where the views are missing instead.
				empty={
					isDrilled
						? {
								description: __(
									'This author has no posts with views for the selected period.',
									'jetpack-premium-analytics-pkg'
								),
							}
						: empty
				}
				renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			>
				<LeaderboardChart
					chartTitle={ __( 'Popular authors', 'jetpack-premium-analytics-pkg' ) }
					data={ chartData }
					withComparison={ withComparison }
					withOverlayLabel
					showLegend={ false }
					legendLabels={ legendLabels }
					dataFormat={ {
						type: 'number',
						options: { useMultipliers: true, decimals: 0 },
					} }
					columns={ {
						label: isDrilled
							? __( 'Posts', 'jetpack-premium-analytics-pkg' )
							: __( 'Authors', 'jetpack-premium-analytics-pkg' ),
						metric: 'views',
					} }
				/>
			</WidgetState>
		</div>
	);
}

function AuthorsReport() {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo(
		() => ( { ...reportParams, max: WIDGET_ROW_LIMIT } ),
		[ reportParams ]
	);

	const { primary, comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsTopAuthors( statsParams, { maxRows: WIDGET_ROW_LIMIT } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = isLoading || primary.isPending;

	const rows = useMemo(
		() => buildTopAuthorsData( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);

	const emptyState = useNoViewsEmptyState(
		{ isLoading: isInitialLoading, isError, isEmpty: rows.length === 0 },
		__( 'You don’t have authors recorded yet.', 'jetpack-premium-analytics-pkg' )
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	useReportActions( {
		csv: {
			exporter: authorsCsvExporter,
			status: { isLoading: isInitialLoading, isFetching, isError: primary.isError },
			rowCount: rows.length,
		},
	} );

	return (
		<AuthorsLeaderboard
			rows={ rows }
			isLoading={ emptyState.isLoading }
			isFetching={ isFetching }
			// `placeholderData` keeps the prior period's rows on screen while `isError`
			// flips true, so a transient refetch failure should not replace them.
			isError={ rows.length === 0 && isError }
			refetch={ refetch }
			withComparison={ hasComparison }
			legendLabels={ legendLabels }
			empty={ emptyState.empty }
		/>
	);
}

export default function Authors( { attributes = {} }: AuthorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<AuthorsReport />
			</div>
		</WidgetRoot>
	);
}
