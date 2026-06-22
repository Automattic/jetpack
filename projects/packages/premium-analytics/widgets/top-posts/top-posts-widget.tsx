/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	calculateDelta,
	type LeaderboardChartData,
	type LegendLabels,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './top-posts-widget.module.css';
import type { TopPostRow } from './types';

export type TopPostsWidgetProps = {
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
 * Renders a post/page title as a link that opens in a new tab. The link fills
 * its row so the leaderboard overlay bar gets its height from the label.
 *
 * @param props       - Component props.
 * @param props.label - The post/page title.
 * @param props.href  - The published URL of the post/page.
 * @return The rendered label link.
 */
const TopPostLabel = ( { label, href }: { label: string; href: string } ) => (
	<a
		className={ styles.labelLink }
		href={ href }
		target="_blank"
		rel="noopener noreferrer"
		title={ label }
	>
		{ label }
	</a>
);

/**
 * Maps normalized top-posts rows onto the shape `LeaderboardChart` expects.
 * Current shares are computed relative to the most-viewed row so the overlay
 * bars are proportional. When `withComparison` is set, previous-period shares
 * and per-row deltas are derived from each row's `previousValue`; otherwise
 * the comparison fields are zeroed.
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
			label: <TopPostLabel label={ row.label } href={ row.href } />,
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentViews ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue > 0 ? ( previousValue / maxPreviousViews ) * 100 : 0,
			delta: withComparison ? calculateDelta( row.value, previousValue ) : 0,
		};
	} );
}

/**
 * "Top posts & pages" widget. Renders the most-viewed posts and pages for the
 * period as a leaderboard, each row linking to the published content.
 *
 * This is a presentational component: it takes already-fetched rows via props
 * and is responsible only for the loading, error, empty, and populated states.
 *
 * @param props                - Component props.
 * @param props.rows           - Normalized top-posts rows to render.
 * @param props.isLoading      - Whether the chart should render its loading overlay.
 * @param props.isError        - Whether to render an error message in place of the chart.
 * @param props.withComparison - Whether to render previous-period deltas.
 * @param props.showLegend     - Whether to show the period legend below the chart.
 * @param props.legendLabels   - Custom labels for the current/comparison periods.
 * @return The rendered widget.
 */
export const TopPostsWidget = ( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	showLegend = false,
	legendLabels,
}: TopPostsWidgetProps ) => {
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
