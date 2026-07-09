/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type StatsArchivesItem,
	type StatsNormalizedReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetBackLink,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
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
	 * URL of the published post/page. Rows without one (the Archives view's
	 * aggregate rows) render a plain label instead of a link.
	 */
	href?: string;
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

/**
 * Maps normalized top-posts rows onto the shape `LeaderboardChart` expects.
 * Current shares are computed relative to the most-viewed row so the overlay
 * bars are proportional. When `withComparison` is set, previous-period shares
 * and per-row deltas are derived from each row's `previousValue`; otherwise
 * the comparison fields are zeroed.
 *
 * Each row's label is a link that opens the published post/page in a new tab
 * — unless the row has children, in which case it becomes a drill-down row
 * (per the widget drill-down convention: rows with children must not render
 * as external links). The label fills its row so the leaderboard overlay bar
 * gets its height from it.
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
		const previousValue = row.previousValue ?? 0;
		const hasChildren = !! row.children?.length;
		const shouldRenderLink = !! row.href && ! hasChildren;

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			label: shouldRenderLink ? (
				<Link
					className={ styles.labelLink }
					href={ row.href }
					variant="unstyled"
					openInNewTab
					title={ row.label }
				>
					{ row.label }
				</Link>
			) : (
				<Text className={ styles.labelText } title={ row.label }>
					{ row.label }
				</Text>
			),
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentViews ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue > 0 ? ( previousValue / maxPreviousViews ) * 100 : 0,
			delta: withComparison ? calculateDelta( row.value, previousValue ) : 0,
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
	 * Normalized top-posts rows to render. When omitted, the empty state is shown
	 * (unless `isLoading` is set).
	 */
	rows?: TopPostRow[];
	/**
	 * When `true`, a loading overlay is rendered instead of data.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the chart.
	 */
	isError?: boolean;
	/**
	 * When `true`, render the comparison (previous-period) delta next to each
	 * value, using `previousValue` from each row. Mirrors the overlay
	 * comparison mode of the toolkit's `LeaderboardChart`.
	 */
	withComparison?: boolean;
	/**
	 * Message rendered when `isError` is set. Defaults to the Posts & pages
	 * copy; the Archives view passes its own.
	 */
	errorText?: string;
	/**
	 * Callback fired when a row with children is selected. Rows only become
	 * interactive when this is provided.
	 */
	onDrillDown?: ( row: TopPostRow ) => void;
};

/**
 * Presentational leaderboard for the "Top posts & pages" widget. Renders the
 * most-viewed posts and pages for the period, each row linking to the
 * published content.
 *
 * Takes already-fetched rows via props and is responsible only for the
 * loading, error, empty, and populated states.
 *
 * @param {TopPostsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const TopPostsLeaderboard = ( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	errorText,
	onDrillDown,
}: TopPostsLeaderboardProps ) => {
	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ errorText ?? __( 'Unable to load top posts.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && ( ! rows || rows.length === 0 ) ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison, onDrillDown ) }
			loading={ isLoading }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			emptyStateText={ __( 'No views in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ DATA_FORMAT }
		/>
	);
};

/**
 * Flatten the designated `useStatsTopPosts` report into the `{ label, value,
 * href, type }` rows the leaderboard renders. Rows without a link are kept but
 * render unlinked — with `skip_archives=1` the API still returns the
 * "Homepage (Latest posts)" entry, which has no URL.
 *
 * @param report - The normalized top-posts report, or undefined while loading.
 * @return The normalized top-posts rows.
 */
function toTopPostRows(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined
): TopPostRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return items.map( item => ( {
		label: String( item.label ?? '' ),
		value: item.views,
		...( typeof item.link === 'string' && item.link !== '' ? { href: item.link } : {} ),
		type: String( item.type ?? '' ),
	} ) );
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

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsTopPosts( statsParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const primaryRows = useMemo(
		() => toTopPostRows( primary.data as StatsNormalizedReport< StatsTopPostsItem > ),
		[ primary.data ]
	);

	// Comparison-period views keyed the same way the primary rows are: by post
	// URL, falling back to the label for URL-less rows (the homepage entry).
	// Empty when comparison is disabled or the comparison query returned no rows.
	const previousViewsByKey = useMemo( () => {
		if ( ! hasComparison ) {
			return new Map< string, number >();
		}
		return new Map(
			toTopPostRows( comparison.data as StatsNormalizedReport< StatsTopPostsItem > ).map( row => [
				row.href ?? row.label,
				row.value,
			] )
		);
	}, [ comparison.data, hasComparison ] );

	// Only render comparison UI when at least one primary row actually overlaps
	// the comparison period; otherwise unmatched rows would fall to a placeholder
	// `previousValue: 0` and the chart would show a fabricated delta (see AGENTS.md).
	const withComparison =
		hasComparison && primaryRows.some( row => previousViewsByKey.has( row.href ?? row.label ) );

	const rows = useMemo(
		() =>
			withComparison
				? primaryRows.map( row => ( {
						...row,
						previousValue: previousViewsByKey.get( row.href ?? row.label ) ?? 0,
				  } ) )
				: primaryRows,
		[ primaryRows, previousViewsByKey, withComparison ]
	);

	return (
		<div className={ styles.content }>
			<TopPostsLeaderboard
				rows={ rows }
				isLoading={ showLoading }
				isError={ isError }
				withComparison={ withComparison }
			/>
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
			// The homepage set to Latest posts lives under Archives, not in the
			// Posts & pages list (which requests `skip_archives=1`).
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
 * Top-level items of a normalized `stats/archives` report, excluding the
 * homepage entry — it is surfaced in the Posts & pages view instead, matching
 * the Stats "Most viewed" card.
 *
 * @param report - The normalized archives report, or undefined while loading.
 * @return The archive items.
 */
function getArchiveItems(
	report: StatsNormalizedReport< StatsArchivesItem > | undefined
): StatsArchivesItem[] {
	return ( report?.data.flatMap( point => point.items ) ?? [] ).filter(
		item => String( item.label ) !== 'home'
	);
}

/**
 * Comparison-period views for every archive node, keyed by its label path
 * (e.g. `>tax>category>News`) so same-named terms under different parents
 * cannot cross-match.
 *
 * @param items      - The comparison-period archive items.
 * @param parentPath - The key prefix of the parent node.
 * @param lookup     - The accumulating lookup (for recursion).
 * @return The path-keyed view counts.
 */
function buildArchiveComparisonLookup(
	items: StatsArchivesItem[],
	parentPath = '',
	lookup = new Map< string, number >()
): Map< string, number > {
	items.forEach( item => {
		const key = `${ parentPath }>${ String( item.label ?? '' ) }`;
		lookup.set( key, item.value );
		buildArchiveComparisonLookup( item.children ?? [], key, lookup );
	} );

	return lookup;
}

/**
 * Recursively map archive items onto leaderboard rows. Top-level items get
 * the shared archive-category labels; nested items keep their own label
 * (taxonomy name, term, search phrase, …) and carry their archive-page URL.
 * Children are preserved so grouped rows can drill down.
 *
 * @param items            - The archive items at this level.
 * @param comparisonLookup - Path-keyed comparison views from `buildArchiveComparisonLookup`.
 * @param withPrevious     - Whether to attach `previousValue` to the rows.
 * @param parentPath       - The key prefix of the parent node.
 * @return The leaderboard rows, sorted by views.
 */
function toArchiveRows(
	items: StatsArchivesItem[],
	comparisonLookup: Map< string, number >,
	withPrevious: boolean,
	parentPath = ''
): TopPostRow[] {
	return items
		.map( item => {
			const rawLabel = String( item.label ?? '' );
			const key = `${ parentPath }>${ rawLabel }`;
			const children = item.children?.length
				? toArchiveRows( item.children, comparisonLookup, withPrevious, key )
				: undefined;

			return {
				label: parentPath === '' ? archiveTypeLabel( rawLabel ) : rawLabel,
				value: item.value,
				type: 'archive',
				...( typeof item.link === 'string' && item.link !== '' ? { href: item.link } : {} ),
				...( withPrevious ? { previousValue: comparisonLookup.get( key ) ?? 0 } : {} ),
				...( children ? { children } : {} ),
			};
		} )
		.sort( ( a, b ) => b.value - a.value );
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

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsArchives( reportParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const primaryItems = useMemo(
		() => getArchiveItems( primary.data as StatsNormalizedReport< StatsArchivesItem > ),
		[ primary.data ]
	);

	const comparisonLookup = useMemo( () => {
		if ( ! hasComparison ) {
			return new Map< string, number >();
		}
		return buildArchiveComparisonLookup(
			getArchiveItems( comparison.data as StatsNormalizedReport< StatsArchivesItem > )
		);
	}, [ comparison.data, hasComparison ] );

	// Same overlap gating as the Posts & pages view: no comparison UI unless a
	// visible row has a real comparison-period match (see AGENTS.md).
	const withComparison =
		hasComparison &&
		primaryItems.some( item => comparisonLookup.has( `>${ String( item.label ?? '' ) }` ) );

	const rows = useMemo(
		() => toArchiveRows( primaryItems, comparisonLookup, withComparison ).slice( 0, num ),
		[ primaryItems, comparisonLookup, withComparison, num ]
	);

	// Resolve the drill path against the current rows; when a step no longer
	// resolves (e.g. the date range changed), fall back to the deepest list
	// that still exists. The back link names the list it returns to: the root
	// list on the first drill level, otherwise the parent row's label.
	const { activeRows, backLabel } = useMemo( () => {
		let list = rows;
		let label: string | null = null;
		let previousStep: string | null = null;

		for ( const step of drillPath ?? [] ) {
			const parent = list.find( row => row.label === step );
			if ( ! parent?.children?.length ) {
				break;
			}
			label = previousStep ?? __( 'All Archives', 'jetpack-premium-analytics' );
			list = parent.children;
			previousStep = step;
		}

		return { activeRows: list, backLabel: label };
	}, [ rows, drillPath ] );

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
			<TopPostsLeaderboard
				rows={ activeRows }
				isLoading={ showLoading }
				isError={ isError }
				withComparison={ withComparison }
				errorText={ __( 'Unable to load archives.', 'jetpack-premium-analytics' ) }
				onDrillDown={ handleDrillDown }
			/>
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
			</div>
		</WidgetRoot>
	);
}
