/**
 * External dependencies
 */
import {
	useStatsTopPosts,
	type ReportParams,
	type StatsTopPostsComparisonItem,
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
import { Link as RouteLink } from '@wordpress/route';
import { Link as ExternalLink, Text } from '@wordpress/ui';
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

type PostsReportSearch = Partial<
	Pick<
		ReportParams,
		| 'from'
		| 'to'
		| 'interval'
		| 'preset'
		| 'period'
		| 'date_type'
		| 'comp'
		| 'compare_from'
		| 'compare_to'
		| 'compare_preset'
	>
> & {
	section: 'posts-pages';
};

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
		const previousValue = row.previousValue;

		return {
			id: `${ index }-${ row.href }`,
			label: (
				<ExternalLink
					className={ styles.labelLink }
					href={ row.href }
					variant="unstyled"
					openInNewTab
					title={ row.label }
				>
					{ row.label }
				</ExternalLink>
			),
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentViews ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? ( previousValue / maxPreviousViews ) * 100
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
 * Flatten merged data-layer top-posts rows into the `{ label, value, href, type }`
 * rows the leaderboard renders.
 *
 * @param items - Merged top-posts rows from the data layer.
 * @return The normalized top-posts rows.
 */
function toTopPostRows( items: StatsTopPostsComparisonItem[] ): TopPostRow[] {
	return items.map( item => ( {
		label: String( item.label ?? '' ),
		value: item.views,
		previousValue: item.previousViews,
		href: item.link,
		type: String( item.type ?? '' ),
	} ) );
}

/**
 * Build the route search for the full Posts & Pages report, carrying the
 * current dashboard date and comparison params while selecting the report tab
 * that matches this widget's data.
 *
 * @param reportParams - Normalized widget report params from WidgetRoot.
 * @return Search params for the `/reports/$report` route.
 */
function buildPostsReportSearch( reportParams: ReportParams ): PostsReportSearch {
	const {
		from,
		to,
		interval,
		preset,
		period,
		date_type,
		comp,
		compare_from,
		compare_to,
		compare_preset,
	} = reportParams;

	return {
		from,
		to,
		interval,
		...( preset ? { preset } : {} ),
		...( period ? { period } : {} ),
		...( date_type ? { date_type } : {} ),
		...( comp ? { comp } : {} ),
		...( compare_from ? { compare_from } : {} ),
		...( compare_to ? { compare_to } : {} ),
		...( compare_preset ? { compare_preset } : {} ),
		section: 'posts-pages',
	};
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

	const allowedTypes = useMemo( () => {
		if ( postType === undefined || postType === '' ) {
			return null;
		}
		return Array.isArray( postType ) ? postType : [ postType ];
	}, [ postType ] );

	const { comparisonRows, hasComparison, isLoading, isError } = useStatsTopPosts( statsParams, {
		maxRows: num,
		postTypes: allowedTypes,
	} );

	const rows = useMemo( () => toTopPostRows( comparisonRows?.rows ?? [] ), [ comparisonRows ] );
	const withComparison = hasComparison;

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );
	const reportSearch = useMemo( () => buildPostsReportSearch( reportParams ), [ reportParams ] );

	return (
		<div className={ styles.root }>
			<div className={ styles.content }>
				<TopPostsLeaderboard
					rows={ rows }
					isLoading={ isLoading }
					isError={ isError }
					withComparison={ withComparison }
					showLegend={ withComparison }
					legendLabels={ legendLabels }
				/>
			</div>
			<div className={ styles.footer }>
				<RouteLink
					to="/reports/$report"
					params={ { report: 'posts' } as unknown as never }
					search={ reportSearch as unknown as never }
					className={ styles.reportLink }
				>
					{ __( 'See report', 'jetpack-premium-analytics' ) }
				</RouteLink>
			</div>
		</div>
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
