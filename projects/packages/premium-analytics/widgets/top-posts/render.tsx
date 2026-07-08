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
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useMemo } from 'react';
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
};

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type TopPostsRenderAttributes = TopPostsAttributes & Partial< ReportParamsFieldAttributes >;
type TopPostsWidgetProps = WidgetRenderProps< TopPostsRenderAttributes >;

type TopPostsReportProps = Pick< TopPostsAttributes, 'postType' > & { num: number };
const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * Maps normalized top-posts rows onto the shape `LeaderboardChart` expects.
 * Current shares are computed relative to the most-viewed row so the overlay
 * bars are proportional. When `withComparison` is set, previous-period shares
 * and per-row deltas are derived from each row's `previousValue`; otherwise
 * the comparison fields are zeroed.
 *
 * Each row's label is a link that opens the published post/page in a new tab.
 * The link fills its row so the leaderboard overlay bar gets its height from
 * the label.
 *
 * @param rows           - The normalized top-posts rows.
 * @param withComparison - Whether to derive previous-period shares and deltas.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( rows: TopPostRow[], withComparison: boolean ): LeaderboardChartData {
	// `1` guards against division by zero when every value is 0.
	const maxCurrentViews = Math.max( ...rows.map( row => row.value ), 1 );
	const maxPreviousViews = Math.max( ...rows.map( row => row.previousValue ?? 0 ), 1 );

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue ?? 0;

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			label: row.href ? (
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
			data={ buildLeaderboardData( rows, withComparison ) }
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
 * href, type }` rows the leaderboard renders, dropping rows without a link and
 * (optionally) filtering by post type.
 *
 * @param report       - The normalized top-posts report, or undefined while loading.
 * @param allowedTypes - Post types to keep, or null to keep all.
 * @return The normalized top-posts rows.
 */
function toTopPostRows(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined,
	allowedTypes: string[] | null
): TopPostRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return items
		.filter(
			( item ): item is StatsTopPostsItem & { link: string } => typeof item.link === 'string'
		)
		.map( item => ( {
			label: String( item.label ?? '' ),
			value: item.views,
			href: item.link,
			type: String( item.type ?? '' ),
		} ) )
		.filter( row => ! allowedTypes || allowedTypes.includes( row.type ) );
}

/**
 * Fetches the top-posts report through the designated `useStatsTopPosts` Stats
 * traffic hook and hands the normalized rows to the presentational
 * `TopPostsLeaderboard`. The date range and comparison period come from the
 * dashboard picker via `reportParams`.
 *
 * @param {TopPostsReportProps} props - The component props.
 * @return The widget content.
 */
function TopPostsReport( { num, postType }: TopPostsReportProps ) {
	const { reportParams } = useWidgetRootContext();

	// The widget's "Number of results" maps to the WPCOM stats API's `max`; the
	// date range is owned by the dashboard picker and carried in `reportParams`.
	const statsParams = useMemo( () => ( { ...reportParams, max: num } ), [ reportParams, num ] );

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsTopPosts( statsParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const allowedTypes = useMemo( () => {
		if ( postType === undefined || postType === '' ) {
			return null;
		}
		return Array.isArray( postType ) ? postType : [ postType ];
	}, [ postType ] );

	const primaryRows = useMemo(
		() => toTopPostRows( primary.data as StatsNormalizedReport< StatsTopPostsItem >, allowedTypes ),
		[ primary.data, allowedTypes ]
	);

	// Comparison-period views keyed by the same post URL the primary rows use.
	// Empty when comparison is disabled or the comparison query returned no rows.
	const previousViewsByHref = useMemo( () => {
		if ( ! hasComparison ) {
			return new Map< string, number >();
		}
		return new Map(
			toTopPostRows(
				comparison.data as StatsNormalizedReport< StatsTopPostsItem >,
				allowedTypes
			).map( row => [ row.href, row.value ] )
		);
	}, [ comparison.data, allowedTypes, hasComparison ] );

	// Only render comparison UI when at least one primary row actually overlaps
	// the comparison period; otherwise unmatched rows would fall to a placeholder
	// `previousValue: 0` and the chart would show a fabricated delta (see AGENTS.md).
	const withComparison =
		hasComparison && primaryRows.some( row => previousViewsByHref.has( row.href ) );

	const rows = useMemo(
		() =>
			withComparison
				? primaryRows.map( row => ( {
						...row,
						previousValue: previousViewsByHref.get( row.href ) ?? 0,
				  } ) )
				: primaryRows,
		[ primaryRows, previousViewsByHref, withComparison ]
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
	switch ( archiveType ) {
		case 'home':
			return __( 'Home page', 'jetpack-premium-analytics' );
		case 'search':
			return __( 'Search results', 'jetpack-premium-analytics' );
		case 'post_type':
			return __( 'Post type archives', 'jetpack-premium-analytics' );
		case 'tax':
		case 'cat':
			return __( 'Taxonomy archives', 'jetpack-premium-analytics' );
		case 'author':
			return __( 'Author archives', 'jetpack-premium-analytics' );
		case 'date':
			return __( 'Date archives', 'jetpack-premium-analytics' );
		default:
			return archiveType;
	}
}

/**
 * Flatten the normalized `stats/archives` report into keyed rows: one row per
 * archive type present in the period, with the views of its individual archive
 * pages already summed by the data layer.
 *
 * @param report - The normalized archives report, or undefined while loading.
 * @return The keyed archive rows.
 */
function toArchiveRows(
	report: StatsNormalizedReport< StatsArchivesItem > | undefined
): Array< { key: string; label: string; value: number } > {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return items.map( item => {
		const key = String( item.label ?? '' );

		return { key, label: archiveTypeLabel( key ), value: item.value };
	} );
}

/**
 * The Archives view: views of archive pages (home, taxonomy, post-type,
 * search, and date archives) as one aggregate row per archive type, through
 * the designated `useStatsArchives` Stats traffic hook. Mirrors
 * `TopPostsReport`: the date range and comparison period come from the
 * dashboard picker via `reportParams`, and comparison UI is gated on real
 * row overlap between the two periods.
 *
 * @param props     - The component props.
 * @param props.num - Maximum number of rows to display.
 * @return The widget content.
 */
function ArchivesReport( { num }: { num: number } ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsArchives( reportParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const primaryRows = useMemo(
		() => toArchiveRows( primary.data as StatsNormalizedReport< StatsArchivesItem > ),
		[ primary.data ]
	);

	const previousViewsByKey = useMemo( () => {
		if ( ! hasComparison ) {
			return new Map< string, number >();
		}
		return new Map(
			toArchiveRows( comparison.data as StatsNormalizedReport< StatsArchivesItem > ).map( row => [
				row.key,
				row.value,
			] )
		);
	}, [ comparison.data, hasComparison ] );

	// Same overlap gating as the Posts & pages view: no comparison UI unless a
	// visible row has a real comparison-period match (see AGENTS.md).
	const withComparison =
		hasComparison && primaryRows.some( row => previousViewsByKey.has( row.key ) );

	const rows = useMemo(
		() =>
			primaryRows.slice( 0, num ).map( row => ( {
				label: row.label,
				value: row.value,
				type: 'archive',
				...( withComparison ? { previousValue: previousViewsByKey.get( row.key ) ?? 0 } : {} ),
			} ) ),
		[ primaryRows, previousViewsByKey, withComparison, num ]
	);

	return (
		<div className={ styles.content }>
			<TopPostsLeaderboard
				rows={ rows }
				isLoading={ showLoading }
				isError={ isError }
				withComparison={ withComparison }
				errorText={ __( 'Unable to load archives.', 'jetpack-premium-analytics' ) }
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
					<TopPostsReport num={ num } postType={ attributes.postType } />
				) }
			</div>
		</WidgetRoot>
	);
}
