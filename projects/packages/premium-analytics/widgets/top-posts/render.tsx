/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type StatsArchivesComparisonItem,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	LeaderboardChart,
	LeaderboardSkeleton,
	ReportLink,
	RowsCsvDownloadButton,
	WIDGET_ROW_LIMIT,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	calculateDelta,
	getCombinedPeriodMax,
	safeHttpUrl,
	sharePercentage,
	useReportCsvExport,
	useWidgetDrillDown,
	useWidgetNavigationSearch,
	useWidgetRootContext,
	type CsvColumn,
	type LeaderboardChartData,
	type LeaderboardRowAction,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TopPostsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * A single normalized top-posts row, flattened from the designated
 * `useStatsTopPosts` report into the shape the leaderboard renders.
 */
export type TopPostRow = {
	/**
	 * Post or page title, or an archive-type label in the Archives view.
	 */
	label: string;
	/**
	 * View count for the period.
	 */
	value: number;
	/**
	 * View count for the comparison (previous) period. Only used when the
	 * leaderboard is rendered with `withComparison`; omit it for single-period
	 * views.
	 */
	previousValue?: number;
	/**
	 * Public URL of the content (post, page, or archive page). Only used when
	 * the row has no post ID, as the fallback link out to the site.
	 */
	href?: string;
	/**
	 * Post or page ID. Rows carrying one link to the internal detail page.
	 */
	postId?: number;
	/**
	 * Post type, e.g. `post` or `page`.
	 */
	type: string;
	/**
	 * Child rows to drill into (the Archives view's grouped items). Rows with
	 * children render as drill-down rows instead of links.
	 */
	children?: TopPostRow[];
};

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type TopPostsRenderAttributes = TopPostsAttributes & Partial< ReportParamsFieldAttributes >;
type TopPostsWidgetProps = WidgetRenderProps< TopPostsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/** Pick the one action a top-posts row exposes. */
function resolveRowAction(
	row: TopPostRow,
	detailSearch: Record< string, unknown >,
	onDrillDown?: ( row: TopPostRow ) => void
): LeaderboardRowAction {
	if ( ! row.children?.length ) {
		return { kind: 'postLink', id: row.postId, href: row.href, search: detailSearch };
	}

	if ( ! onDrillDown ) {
		return { kind: 'static' };
	}

	return {
		kind: 'drillDown',
		onClick: () => onDrillDown( row ),
		ariaLabel: sprintf(
			/* translators: %s is an archive category label, e.g. "Searches". */
			__( 'View %s archive pages', 'jetpack-premium-analytics-pkg' ),
			row.label
		),
	};
}

/**
 * Maps normalized top-posts rows onto the shape `LeaderboardChart` expects.
 * Shares use the largest value across both periods as one denominator, so
 * equal-width bars represent equal values.
 */
function buildLeaderboardData(
	rows: TopPostRow[],
	withComparison: boolean,
	detailSearch: Record< string, unknown >,
	onDrillDown?: ( row: TopPostRow ) => void
): LeaderboardChartData {
	const maxViews = getCombinedPeriodMax(
		rows.map( row => row.value ),
		withComparison ? rows.map( row => row.previousValue ) : []
	);

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue;

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			...buildLeaderboardRow( {
				label: row.label,
				media: { kind: 'none' },
				action: resolveRowAction( row, detailSearch, onDrillDown ),
			} ),
			currentValue: row.value,
			currentShare: sharePercentage( row.value, maxViews ),
			// Rows without a comparison-period match keep `undefined` so the chart
			// renders a placeholder instead of a fabricated delta (see AGENTS.md).
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? sharePercentage( previousValue, maxViews )
					: undefined,
			delta:
				withComparison && previousValue !== undefined
					? calculateDelta( row.value, previousValue )
					: undefined,
		};
	} );
}

type TopPostsLeaderboardProps = {
	/**
	 * Normalized top-posts rows to render.
	 */
	rows?: TopPostRow[];
	/**
	 * When `true`, render the comparison (previous-period) delta next to each
	 * value, using `previousValue` from each row. Mirrors the overlay
	 * comparison mode of the toolkit's `LeaderboardChart`.
	 */
	withComparison?: boolean;
	/**
	 * Callback fired when a row with children is selected. Rows only become
	 * interactive when this is provided.
	 */
	onDrillDown?: ( row: TopPostRow ) => void;
	/**
	 * Shared report-window parameters carried into the post-detail route, so
	 * the detail page opens on the date range the widget is showing.
	 */
	detailSearch?: Record< string, unknown >;
};

/**
 * Presentational leaderboard for the "Most viewed" widget. Renders
 * already-fetched rows; loading, error, and empty states are owned by the
 * `<WidgetState>` wrapper in the report components.
 */
export const TopPostsLeaderboard = ( {
	rows = [],
	withComparison = false,
	onDrillDown,
	detailSearch = {},
}: TopPostsLeaderboardProps ) => {
	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison, detailSearch, onDrillDown ) }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			dataFormat={ DATA_FORMAT }
		/>
	);
};

/**
 * Maps merged top-posts rows to leaderboard shape. With `skip_archives=1` the
 * API still returns a link-less "Homepage (Latest posts)" entry, kept unlinked.
 */
function toTopPostRows( items: StatsTopPostsComparisonItem[] ): TopPostRow[] {
	return items.map( item => {
		const postId = Number( item.id );
		const href = safeHttpUrl( item.link );

		return {
			// A row without a title still needs a visible, clickable label.
			label: String( item.label ?? '' ) || __( 'Untitled', 'jetpack-premium-analytics-pkg' ),
			value: item.views,
			...( item.previousViews !== undefined ? { previousValue: item.previousViews } : {} ),
			...( href ? { href } : {} ),
			// The homepage entry (id 0) has no post-detail page.
			...( Number.isFinite( postId ) && postId > 0 ? { postId } : {} ),
			type: String( item.type ?? '' ),
		};
	} );
}

/**
 * Fetches top-posts via `useStatsTopPosts` and feeds `TopPostsLeaderboard`.
 * Same `skip_archives=1` homepage-entry caveat as `toTopPostRows`.
 */
function TopPostsReport() {
	const { reportParams } = useWidgetRootContext();

	const statsParams = useMemo(
		() => ( { ...reportParams, max: WIDGET_ROW_LIMIT } ),
		[ reportParams ]
	);

	// Row matching, capping, and comparison-overlap gating live in the data
	// layer's merge helper (see AGENTS.md), which appends the homepage entry on top of `max`.
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsTopPosts( statsParams, { maxRows: WIDGET_ROW_LIMIT } );

	const rows = useMemo( () => toTopPostRows( comparisonRows?.rows ?? [] ), [ comparisonRows ] );
	const detailSearch = useWidgetNavigationSearch();
	const withComparison = hasComparison;

	// Serialize whatever the leaderboard has loaded, mirroring the Jetpack Stats
	// client-side "Download CSV" (bounded to the rows already in the browser).
	const csvColumns = useMemo< CsvColumn< TopPostRow >[] >( () => {
		const base: CsvColumn< TopPostRow >[] = [
			{ label: __( 'Title', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
			{ label: __( 'Type', 'jetpack-premium-analytics-pkg' ), getValue: row => row.type },
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.href },
		];
		if ( withComparison ) {
			base.splice( 2, 0, {
				label: __( 'Previous views', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.previousValue,
			} );
		}
		return base;
	}, [ withComparison ] );

	// Stats queries keep placeholder rows during a refetch; the shared hook hides
	// export until rows belong to the active date range.
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows,
		filenamePrefix: 'top-posts',
		range: reportParams,
		status: { isLoading, isFetching, isError },
	} );

	return (
		<>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// `placeholderData` keeps stale rows visible after a failed range change;
					// only surface the error when nothing is on screen.
					isError={ rows.length === 0 && isError }
					isEmpty={ rows.length === 0 }
					error={ {
						description: __(
							"We couldn't load posts and pages. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						icon: reports,
						description: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ),
					} }
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<TopPostsLeaderboard
						rows={ rows }
						withComparison={ withComparison }
						detailSearch={ detailSearch }
					/>
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="posts" section="posts-pages" />
				{ canExport && (
					<RowsCsvDownloadButton columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) }
			</WidgetFooter>
		</>
	);
}

/**
 * Human-readable labels for the archive-type keys the WPCOM `stats/archives`
 * report groups by. Types the API may add later fall back to the raw key.
 */
function archiveTypeLabel( archiveType: string ): string {
	// Mirrors Calypso's `getArchiveKeyLabel` (state/stats/lists/utils.js); `post_type`
	// is PA-only — Calypso capitalizes it instead.
	switch ( archiveType ) {
		case 'author':
			return __( 'Authors', 'jetpack-premium-analytics-pkg' );
		case 'cat':
			return __( 'Categories', 'jetpack-premium-analytics-pkg' );
		case 'err':
			return __( 'Error', 'jetpack-premium-analytics-pkg' );
		case 'home':
			// Defensive: `skip_archives=1` normally keeps `home` out of this report (it's
			// filtered in the Archives view); matches the server title if one slips through.
			return __( 'Homepage (Latest posts)', 'jetpack-premium-analytics-pkg' );
		case 'search':
			return __( 'Searches', 'jetpack-premium-analytics-pkg' );
		case 'tag':
			return __( 'Tags', 'jetpack-premium-analytics-pkg' );
		case 'tax':
			return __( 'Taxonomies', 'jetpack-premium-analytics-pkg' );
		case 'date':
			return __( 'Dates', 'jetpack-premium-analytics-pkg' );
		case 'multiple':
			return __( 'Aggregated', 'jetpack-premium-analytics-pkg' );
		case 'other':
			return __( 'Others', 'jetpack-premium-analytics-pkg' );
		case 'post_type':
			return __( 'Post types', 'jetpack-premium-analytics-pkg' );
		default:
			return archiveType.charAt( 0 ).toUpperCase() + archiveType.slice( 1 ).toLowerCase();
	}
}

/**
 * Humanize an intermediate group label from the API (e.g. the taxonomy key
 * `post_tag` → "Post tag", `topics` → "Topics"). Leaf labels — search
 * phrases, term names — are never passed through this.
 */
function humanizeArchiveGroupLabel( label: string ): string {
	const spaced = label.replace( /_/g, ' ' );
	return spaced.charAt( 0 ).toUpperCase() + spaced.slice( 1 );
}

/**
 * Recursively maps merged archive rows to leaderboard rows: top-level items
 * get shared category labels, nested groups get humanized labels, leaves keep
 * their own label and URL, and children are preserved for drill-down.
 */
function toArchiveRows( items: StatsArchivesComparisonItem[], isTopLevel = true ): TopPostRow[] {
	return items.map( item => {
		const rawLabel = String( item.label ?? '' );
		const children = item.children?.length ? toArchiveRows( item.children, false ) : undefined;
		const href = safeHttpUrl( item.link );

		let label = rawLabel;
		if ( isTopLevel ) {
			label = archiveTypeLabel( rawLabel );
		} else if ( children ) {
			label = humanizeArchiveGroupLabel( rawLabel );
		}

		return {
			label: label || __( 'Untitled', 'jetpack-premium-analytics-pkg' ),
			value: item.value,
			type: 'archive',
			...( item.previousValue !== undefined ? { previousValue: item.previousValue } : {} ),
			...( href ? { href } : {} ),
			...( children ? { children } : {} ),
		};
	} );
}

/**
 * Archives view via `useStatsArchives`: one aggregate row per archive type,
 * drilling into pages (taxonomies drill twice). Back-link convention matches
 * Locations and Clicks. Comparison UI is gated on real row overlap.
 */
function ArchivesReport() {
	const { reportParams } = useWidgetRootContext();
	const { drillDownItem: drillPath, drillDown, resetDrillDown } = useWidgetDrillDown< string[] >();

	// Row matching (per level, so same-named terms under different parents can't
	// cross-match), capping, and comparison gating live in the merge helper (see AGENTS.md).
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsArchives( reportParams, { maxRows: WIDGET_ROW_LIMIT } );

	const rows = useMemo(
		() =>
			// The homepage entry is surfaced in the Posts & pages view instead,
			// matching the Stats "Most viewed" card — keep it out of Archives.
			toArchiveRows(
				( comparisonRows?.rows ?? [] ).filter( item => String( item.label ) !== 'home' )
			),
		[ comparisonRows ]
	);
	const withComparison = hasComparison;

	// Resolve the drill path against current rows; the back link names the list
	// it returns to (root on the first level, else the parent row's label).
	const { activeRows, backLabel, isPathResolved } = useMemo( () => {
		let list = rows;
		let label: string | null = null;
		let previousStep: string | null = null;
		let resolved = true;

		for ( const step of drillPath ?? [] ) {
			const parent = list.find( row => row.label === step );
			if ( ! parent?.children?.length ) {
				resolved = false;
				break;
			}
			label = previousStep ?? __( 'All archives', 'jetpack-premium-analytics-pkg' );
			list = parent.children;
			previousStep = step;
		}

		return { activeRows: list, backLabel: label, isPathResolved: resolved };
	}, [ rows, drillPath ] );

	// Drop a drilled path the current data no longer contains (e.g. after a date
	// range change) once loading settles — refetches must not wipe a valid selection.
	useEffect( () => {
		if ( drillPath && ! isPathResolved && ! isLoading && ! isFetching ) {
			resetDrillDown();
		}
	}, [ drillPath, isPathResolved, isLoading, isFetching, resetDrillDown ] );

	const handleDrillDown = useCallback(
		( row: TopPostRow ) => {
			drillDown( [ ...( drillPath ?? [] ), row.label ] );
		},
		[ drillDown, drillPath ]
	);

	const handleBack = useCallback( () => {
		const path = drillPath ?? [];
		if ( path.length <= 1 ) {
			resetDrillDown();
			return;
		}
		drillDown( path.slice( 0, -1 ) );
	}, [ drillDown, drillPath, resetDrillDown ] );

	const backLink =
		activeRows === rows ? null : (
			<WidgetBackLink
				label={ backLabel ?? __( 'All archives', 'jetpack-premium-analytics-pkg' ) }
				ariaLabel={ __( 'Back to the previous archive list', 'jetpack-premium-analytics-pkg' ) }
				onClick={ handleBack }
			/>
		);

	return (
		<div className={ styles.content }>
			{ backLink }
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// As above: keep the drilled rows visible through a transient refetch
				// failure and only surface the error when there is nothing to show.
				isError={ rows.length === 0 && isError }
				isEmpty={ activeRows.length === 0 }
				error={ {
					description: __(
						"We couldn't load archives. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			>
				<TopPostsLeaderboard
					rows={ activeRows }
					withComparison={ withComparison }
					onDrillDown={ handleDrillDown }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * `contentView` (`relevance: 'high'`) switches Posts & pages vs. Archives.
 * Defaults are applied here, in exactly one place, before inner components see them.
 */
export default function TopPosts( { attributes = {} }: TopPostsWidgetProps ) {
	const contentView = attributes.contentView ?? 'posts';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				{ contentView === 'archives' ? (
					<>
						<ArchivesReport />
						<WidgetFooter>
							<ReportLink report="posts" section="archives" />
						</WidgetFooter>
					</>
				) : (
					<TopPostsReport />
				) }
			</div>
		</WidgetRoot>
	);
}
