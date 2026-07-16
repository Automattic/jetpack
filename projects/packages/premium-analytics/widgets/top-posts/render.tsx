/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	useStatsArchives,
	useStatsTopPosts,
	type StatsArchivesComparisonItem,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import { Icon, external } from '@wordpress/icons';
import {
	DownloadCsvButton,
	LeaderboardChart,
	ReportLink,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	calculateDelta,
	usePostDetailHrefBuilder,
	useWidgetDrillDown,
	useWidgetRootContext,
	type CsvColumn,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
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
	 * Public URL of the content (post, page, or archive page). Rows with one
	 * get a trailing external-link icon that opens it in a new tab.
	 */
	href?: string;
	/**
	 * Internal analytics post-detail href. Only post/page rows with a real
	 * post ID get one; their title links here (same tab).
	 */
	detailHref?: string;
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

type TopPostsReportProps = { num: number };
const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

function areClientSideCsvExportsEnabled(): boolean {
	return getScriptData()?.premium_analytics?.client_side_csv_exports_enabled === true;
}

/**
 * Maps normalized top-posts rows onto the shape `LeaderboardChart` expects.
 * Current shares are computed relative to the most-viewed row so the overlay
 * bars are proportional. When `withComparison` is set, previous-period shares
 * and per-row deltas are derived from each row's `previousValue`; otherwise
 * the comparison fields are zeroed.
 *
 * Post/page titles link to the internal analytics post-detail page (same
 * tab); rows with a public URL also get a trailing external-link icon that
 * opens the site in a new tab. Rows with children instead become drill-down
 * rows (per the widget drill-down convention they carry no anchors), and
 * rows with neither (e.g. the homepage entry) render plain text. The label
 * fills its row so the leaderboard overlay bar gets its height from it.
 *
 * @param rows           - The normalized top-posts rows.
 * @param withComparison - Whether to derive previous-period shares and deltas.
 * @param onDrillDown    - Callback fired when a row with children is selected.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData(
	rows: TopPostRow[],
	withComparison: boolean,
	onDrillDown?: ( row: TopPostRow ) => void
): LeaderboardChartData {
	// `1` guards against division by zero when every value is 0.
	const maxCurrentViews = Math.max( ...rows.map( row => row.value ), 1 );
	const maxPreviousViews = Math.max( ...rows.map( row => row.previousValue ?? 0 ), 1 );

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue;
		const hasChildren = !! row.children?.length;
		// Rows inside a drill-down button cannot carry anchors, and only rows
		// with a real post ID have an internal detail page to link to.
		const titleLink = ! hasChildren && row.detailHref;
		const externalLink = ! hasChildren && row.href;

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			label: (
				<span className={ styles.labelRow }>
					{ titleLink ? (
						<Link
							className={ styles.labelTitleLink }
							href={ row.detailHref }
							variant="unstyled"
							title={ row.label }
						>
							{ row.label }
						</Link>
					) : (
						<Text className={ styles.labelTitle } title={ row.label }>
							{ row.label }
						</Text>
					) }
					{ externalLink && (
						<Link
							className={ styles.externalLink }
							href={ row.href }
							variant="unstyled"
							openInNewTab
							aria-label={ sprintf(
								/* translators: %s is a post, page, or archive page title. */
								__( 'Open %s in a new tab', 'jetpack-premium-analytics' ),
								row.label
							) }
						>
							<Icon icon={ external } size={ 16 } />
						</Link>
					) }
				</span>
			),
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentViews ) * 100,
			// Rows without a comparison-period match keep `undefined` so the chart
			// renders a placeholder instead of a fabricated delta (see AGENTS.md).
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? ( previousValue / maxPreviousViews ) * 100
					: undefined,
			delta:
				withComparison && previousValue !== undefined
					? calculateDelta( row.value, previousValue )
					: undefined,
			...( hasChildren &&
				onDrillDown && {
					onClick: () => onDrillDown( row ),
					ariaLabel: sprintf(
						/* translators: %s is an archive category label, e.g. "Searches". */
						__( 'View %s archive pages', 'jetpack-premium-analytics' ),
						row.label
					),
				} ),
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
};

/**
 * Presentational leaderboard for the "Most viewed" widget. Renders
 * already-fetched rows; loading, error, and empty states are owned by the
 * `<WidgetState>` wrapper in the report components.
 *
 * @param {TopPostsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const TopPostsLeaderboard = ( {
	rows = [],
	withComparison = false,
	onDrillDown,
}: TopPostsLeaderboardProps ) => {
	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison, onDrillDown ) }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			dataFormat={ DATA_FORMAT }
		/>
	);
};

/**
 * Map the data layer's merged top-posts rows onto the shape the leaderboard
 * renders. Rows without a link are kept but render unlinked — with
 * `skip_archives=1` the API still returns the "Homepage (Latest posts)"
 * entry, which has no URL or post ID. Missing comparison matches stay
 * `undefined`.
 *
 * @param items           - The merged comparison rows from `useStatsTopPosts`.
 * @param buildDetailHref - Maps a post ID to the internal post-detail href.
 * @return The normalized top-posts rows.
 */
function toTopPostRows(
	items: StatsTopPostsComparisonItem[],
	buildDetailHref: ( postId: number | string ) => string
): TopPostRow[] {
	return items.map( item => {
		const postId = Number( item.id );

		return {
			// A row without a title still needs a visible, clickable label.
			label: String( item.label ?? '' ) || __( 'Untitled', 'jetpack-premium-analytics' ),
			value: item.views,
			...( item.previousViews !== undefined ? { previousValue: item.previousViews } : {} ),
			...( typeof item.link === 'string' && item.link !== '' ? { href: item.link } : {} ),
			// The homepage entry (id 0) has no post-detail page.
			...( Number.isFinite( postId ) && postId > 0
				? { detailHref: buildDetailHref( postId ) }
				: {} ),
			type: String( item.type ?? '' ),
		};
	} );
}

/**
 * Fetches the top-posts report through the designated `useStatsTopPosts` Stats
 * traffic hook and hands the normalized rows to the presentational
 * `TopPostsLeaderboard`. The date range and comparison period come from the
 * dashboard picker via `reportParams`.
 *
 * With `skip_archives=1` the API keeps the homepage-as-latest-posts entry in
 * `postviews` (titled "Homepage (Latest posts)", no URL), so it surfaces here
 * in the Posts & pages list — same distribution as the Stats "Most viewed"
 * card, where the Archives list excludes it.
 *
 * @param {TopPostsReportProps} props - The component props.
 * @return The widget content.
 */
function TopPostsReport( { num }: TopPostsReportProps ) {
	const { reportParams } = useWidgetRootContext();

	// The widget's "Number of results" maps to the WPCOM stats API's `max`; the
	// date range is owned by the dashboard picker and carried in `reportParams`.
	const statsParams = useMemo( () => ( { ...reportParams, max: num } ), [ reportParams, num ] );

	// Row matching, ranked capping (the API caps `postviews` at `max` but
	// appends the homepage entry on top of it), and comparison-overlap gating
	// all live in the data layer's merge helper (see AGENTS.md).
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsTopPosts( statsParams, { maxRows: num } );

	const buildDetailHref = usePostDetailHrefBuilder();
	const rows = useMemo(
		() => toTopPostRows( comparisonRows?.rows ?? [], buildDetailHref ),
		[ comparisonRows, buildDetailHref ]
	);
	const withComparison = hasComparison;

	// Serialize whatever the leaderboard has loaded, mirroring the Jetpack Stats
	// client-side "Download CSV" (bounded to the rows already in the browser).
	const csvColumns = useMemo< CsvColumn< TopPostRow >[] >( () => {
		const base: CsvColumn< TopPostRow >[] = [
			{ key: 'label', label: __( 'Title', 'jetpack-premium-analytics' ) },
			{ key: 'value', label: __( 'Views', 'jetpack-premium-analytics' ) },
			{ key: 'type', label: __( 'Type', 'jetpack-premium-analytics' ) },
			{ key: 'href', label: __( 'URL', 'jetpack-premium-analytics' ) },
		];
		if ( withComparison ) {
			base.splice( 2, 0, {
				key: 'previousValue',
				label: __( 'Previous views', 'jetpack-premium-analytics' ),
			} );
		}
		return base;
	}, [ withComparison ] );

	// Date-stamp the download so exports of different periods don't collide.
	// `from`/`to` are coerced because the router JSON-parses search params, so a
	// hand-edited numeric `?from=123` would otherwise throw on `.slice`.
	const csvFilename = `top-posts-${ String( reportParams.from ).slice( 0, 10 ) }_${ String(
		reportParams.to
	).slice( 0, 10 ) }`;

	// Only expose the export once the query has settled on data for the current
	// params. Stats queries keep the previous period's rows as placeholder data
	// while a refetch is in flight, so exporting mid-fetch (or after an error)
	// could hand the user stale rows under the new-period `csvFilename`.
	const canExport =
		areClientSideCsvExportsEnabled() && rows.length > 0 && ! isFetching && ! isError;

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The Stats queries carry `placeholderData`, so a failed range change
				// keeps the prior period's rows visible; only surface the error when
				// there is nothing to show.
				isError={ rows.length === 0 && isError }
				isEmpty={ rows.length === 0 }
				error={ {
					description: __(
						"We couldn't load posts and pages. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __( 'No views in this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<TopPostsLeaderboard rows={ rows } withComparison={ withComparison } />
			</WidgetState>
			{ canExport && (
				<div className={ styles.contentExport }>
					<DownloadCsvButton columns={ csvColumns } rows={ rows } filename={ csvFilename } />
				</div>
			) }
		</div>
	);
}

/**
 * Human-readable labels for the archive-type keys the WPCOM `stats/archives`
 * report groups by. Types the API may add later fall back to the raw key.
 *
 * @param archiveType - The raw archive-type key from the report.
 * @return The display label for the archive type.
 */
function archiveTypeLabel( archiveType: string ): string {
	// Same labels as the Calypso Stats "Most viewed" card's Archives tab
	// (`getArchiveKeyLabel` in calypso/state/stats/lists/utils.js), so both
	// surfaces name archive categories identically. `post_type` is a PA
	// addition — Calypso falls through to capitalization for it.
	switch ( archiveType ) {
		case 'author':
			return __( 'Authors', 'jetpack-premium-analytics' );
		case 'cat':
			return __( 'Categories', 'jetpack-premium-analytics' );
		case 'err':
			return __( 'Error', 'jetpack-premium-analytics' );
		case 'home':
			// Defensive only: with `skip_archives=1` the API surfaces the homepage
			// entry inside the Posts & pages list (server-titled) and drops it
			// from this report, and the Archives view filters any residual `home`
			// entry out. This label matches the server title if one slips through.
			return __( 'Homepage (Latest posts)', 'jetpack-premium-analytics' );
		case 'search':
			return __( 'Searches', 'jetpack-premium-analytics' );
		case 'tag':
			return __( 'Tags', 'jetpack-premium-analytics' );
		case 'tax':
			return __( 'Taxonomies', 'jetpack-premium-analytics' );
		case 'date':
			return __( 'Dates', 'jetpack-premium-analytics' );
		case 'multiple':
			return __( 'Aggregated', 'jetpack-premium-analytics' );
		case 'other':
			return __( 'Others', 'jetpack-premium-analytics' );
		case 'post_type':
			return __( 'Post types', 'jetpack-premium-analytics' );
		default:
			return archiveType.charAt( 0 ).toUpperCase() + archiveType.slice( 1 ).toLowerCase();
	}
}

/**
 * Humanize an intermediate group label from the API (e.g. the taxonomy key
 * `post_tag` → "Post tag", `topics` → "Topics"). Leaf labels — search
 * phrases, term names — are never passed through this.
 *
 * @param label - The raw group label.
 * @return The humanized label.
 */
function humanizeArchiveGroupLabel( label: string ): string {
	const spaced = label.replace( /_/g, ' ' );
	return spaced.charAt( 0 ).toUpperCase() + spaced.slice( 1 );
}

/**
 * Recursively map the data layer's merged archive rows onto leaderboard rows.
 * Top-level items get the shared archive-category labels; nested group items
 * (taxonomy keys) are humanized; leaf items keep their own label (term name,
 * search phrase, …) and carry their archive-page URL. Children are preserved
 * so grouped rows can drill down, and missing comparison matches stay
 * `undefined`.
 *
 * @param items      - The merged comparison rows from `useStatsArchives`.
 * @param isTopLevel - Whether the items are archive-type rows.
 * @return The leaderboard rows.
 */
function toArchiveRows( items: StatsArchivesComparisonItem[], isTopLevel = true ): TopPostRow[] {
	return items.map( item => {
		const rawLabel = String( item.label ?? '' );
		const children = item.children?.length ? toArchiveRows( item.children, false ) : undefined;

		let label = rawLabel;
		if ( isTopLevel ) {
			label = archiveTypeLabel( rawLabel );
		} else if ( children ) {
			label = humanizeArchiveGroupLabel( rawLabel );
		}

		return {
			label: label || __( 'Untitled', 'jetpack-premium-analytics' ),
			value: item.value,
			type: 'archive',
			...( item.previousValue !== undefined ? { previousValue: item.previousValue } : {} ),
			...( typeof item.link === 'string' && item.link !== '' ? { href: item.link } : {} ),
			...( children ? { children } : {} ),
		};
	} );
}

/**
 * The Archives view: views of archive pages (taxonomy, post-type, search, and
 * date archives) as one aggregate row per archive type, through the designated
 * `useStatsArchives` Stats traffic hook. Grouped rows drill into their
 * individual archive pages (taxonomies drill twice: taxonomy → terms), with a
 * back link to the parent list — the same convention as the Locations and
 * Clicks widgets. Mirrors `TopPostsReport` otherwise: the date range and
 * comparison period come from the dashboard picker via `reportParams`, and
 * comparison UI is gated on real row overlap between the two periods.
 *
 * @param props     - The component props.
 * @param props.num - Maximum number of top-level rows to display.
 * @return The widget content.
 */
function ArchivesReport( { num }: { num: number } ) {
	const { reportParams } = useWidgetRootContext();
	const { drillDownItem: drillPath, drillDown, resetDrillDown } = useWidgetDrillDown< string[] >();

	// Row matching (per level, so same-named terms under different parents
	// cannot cross-match), the visible-row cap, and the comparison-overlap
	// gate all live in the data layer's merge helper (see AGENTS.md).
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsArchives( reportParams, { maxRows: num } );

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

	// Resolve the drill path against the current rows. The back link names the
	// list it returns to: the root list on the first drill level, otherwise the
	// parent row's label.
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
			label = previousStep ?? __( 'All Archives', 'jetpack-premium-analytics' );
			list = parent.children;
			previousStep = step;
		}

		return { activeRows: list, backLabel: label, isPathResolved: resolved };
	}, [ rows, drillPath ] );

	// When the data no longer contains the drilled path (e.g. the date range
	// changed and the archive type disappeared), drop the stale selection so
	// the root list is fully interactive again. Skip while a fetch is in
	// flight: placeholder/refreshing data must not wipe a valid selection.
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
				label={ backLabel ?? __( 'All Archives', 'jetpack-premium-analytics' ) }
				ariaLabel={ __( 'Back to the previous archive list', 'jetpack-premium-analytics' ) }
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
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __( 'No views in this period.', 'jetpack-premium-analytics' ),
				} }
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
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them.
 *
 * The `contentView` attribute (`relevance: 'high'`, so the widget host renders
 * its control in the frame header) switches between the Posts & pages and
 * Archives views. Attribute defaults are applied here, in exactly one place,
 * before the inner components receive them.
 *
 * @param {TopPostsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TopPosts( { attributes = {} }: TopPostsWidgetProps ) {
	const num = attributes.num ?? 10;
	const contentView = attributes.contentView ?? 'posts';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				{ contentView === 'archives' ? (
					<ArchivesReport num={ num } />
				) : (
					<TopPostsReport num={ num } />
				) }
				<WidgetFooter>
					<ReportLink
						report="posts"
						section={ contentView === 'archives' ? 'archives' : 'posts-pages' }
					/>
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
