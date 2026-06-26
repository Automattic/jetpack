/**
 * External dependencies
 */
import {
	computeDateRangeFromPreset,
	localTZDate,
	useStatsTopPosts,
	type StatsNormalizedReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	type LeaderboardChartData,
	type LegendLabels,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './top-posts.module.css';
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

type TopPostsProps = {
	attributes?: TopPostsAttributes;
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
 * `TopPostsLeaderboard`.
 *
 * @param props            - Component props.
 * @param props.attributes - Widget attributes.
 * @return The widget content.
 */
function TopPostsReport( { attributes }: TopPostsProps ) {
	// Default to the trailing 7 days, matching the Jetpack Stats "Top posts &
	// pages" card's default range.
	const range = attributes?.range ?? 'last-7-days';
	const num = attributes?.num ?? 10;
	const postType = attributes?.postType;

	// Resolve the preset to an absolute window. `computeDateRangeFromPreset`
	// returns ISO strings with a TZ offset; the stats query layer trims them to
	// the date part, so the raw values can be passed straight through.
	const today = format( localTZDate(), 'yyyy-MM-dd' );
	const { from, to } = computeDateRangeFromPreset( range ) ?? {};

	const { primary, isLoading, isError } = useStatsTopPosts( {
		from: from ?? today,
		to: to ?? today,
		interval: 'day',
		period: 'day',
		// The widget's "Number of results" maps to the WPCOM stats API's `max`.
		max: num,
	} );

	const allowedTypes = useMemo( () => {
		if ( postType === undefined || postType === '' ) {
			return null;
		}
		return Array.isArray( postType ) ? postType : [ postType ];
	}, [ postType ] );

	const rows = useMemo(
		() => toTopPostRows( primary.data as StatsNormalizedReport< StatsTopPostsItem >, allowedTypes ),
		[ primary.data, allowedTypes ]
	);

	return <TopPostsLeaderboard rows={ rows } isLoading={ isLoading } isError={ isError } />;
}

/**
 * Widget render entry point.
 *
 * Attributes flow to the inner component via props rather than
 * `WidgetRootContext` — the context's report params are WC-Analytics-shaped
 * and do not fit stats queries. Runs inside `WidgetRoot` so it can reach the
 * analytics query client, keeping the leaderboard prop-driven (and
 * Storybook-friendly).
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function TopPosts( { attributes }: WidgetRenderProps< TopPostsAttributes > ) {
	return (
		<WidgetRoot>
			<TopPostsReport attributes={ attributes } />
		</WidgetRoot>
	);
}
