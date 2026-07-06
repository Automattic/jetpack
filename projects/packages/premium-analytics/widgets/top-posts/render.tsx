/**
 * External dependencies
 */
import {
	useStatsTopPosts,
	type StatsNormalizedReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	formatLegendLabels,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LegendLabels,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TopPostsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * A single normalized top-posts row, flattened from the designated
 * `useStatsTopPosts` report into the shape the leaderboard renders. Exported so
 * Storybook can build fixtures for `TopPostsLeaderboard`.
 */
export type TopPostRow = {
	/**
	 * Post or page title.
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
	 * URL of the published post/page.
	 */
	href: string;
	/**
	 * Post type, e.g. `post` or `page`.
	 */
	type: string;
};

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type TopPostsRenderAttributes = TopPostsAttributes & Partial< ReportParamsFieldAttributes >;
type TopPostsWidgetProps = WidgetRenderProps< TopPostsRenderAttributes >;

type TopPostsReportProps = Pick< TopPostsAttributes, 'num' | 'postType' >;

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
			id: `${ index }-${ row.href }`,
			label: (
				<Link
					className={ styles.labelLink }
					href={ row.href }
					variant="unstyled"
					openInNewTab
					title={ row.label }
				>
					{ row.label }
				</Link>
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
	 * When `true`, show the period legend below the chart. Requires
	 * `legendLabels` to be meaningful.
	 */
	showLegend?: boolean;
	/**
	 * Custom legend labels for the current/comparison periods.
	 */
	legendLabels?: LegendLabels;
};

/**
 * Presentational leaderboard for the "Top posts & pages" widget. Renders the
 * most-viewed posts and pages for the period, each row linking to the
 * published content.
 *
 * Takes already-fetched rows via props and is responsible only for the
 * loading, error, empty, and populated states. Exported so Storybook can
 * exercise those states with fixture rows (there is no analytics backend in
 * Storybook, so the data-connected entry point would only ever show chrome).
 *
 * @param {TopPostsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const TopPostsLeaderboard = ( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	showLegend = false,
	legendLabels,
}: TopPostsLeaderboardProps ) => {
	if ( isError ) {
		return <Text>{ __( 'Unable to load top posts.', 'jetpack-premium-analytics' ) }</Text>;
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
			showLegend={ showLegend }
			legendLabels={ legendLabels }
			emptyStateText={ __( 'No views in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
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
function TopPostsReport( { num = 10, postType }: TopPostsReportProps ) {
	const { reportParams } = useWidgetRootContext();

	// The widget's "Number of results" maps to the WPCOM stats API's `max`; the
	// date range is owned by the dashboard picker and carried in `reportParams`.
	const statsParams = useMemo( () => ( { ...reportParams, max: num } ), [ reportParams, num ] );

	const { primary, comparison, hasComparison, isLoading, isError } =
		useStatsTopPosts( statsParams );

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

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	return (
		<TopPostsLeaderboard
			rows={ rows }
			isLoading={ isLoading }
			isError={ isError }
			withComparison={ withComparison }
			showLegend={ withComparison }
			legendLabels={ legendLabels }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them. The
 * widget's own `num`/`postType` settings are forwarded to the inner component.
 *
 * @param {TopPostsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TopPosts( { attributes = {} }: TopPostsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TopPostsReport num={ attributes.num } postType={ attributes.postType } />
		</WidgetRoot>
	);
}
