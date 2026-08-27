/**
 * External dependencies
 */
import {
	useStatsInsights,
	type StatsInsightsResponse,
	type StatsInsightsYear,
} from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import {
	AnnualHighlightsSkeleton,
	MetricTileGrid,
	ReportLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { calendar, comment, paragraph, postList, starEmpty } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { resolveSelectedYear } from './years';
import type { AnnualHighlightsAttributes } from './widget';
import type { YearPresetId } from '@jetpack-premium-analytics/datetime';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The insights endpoint is not period-scoped: one request returns every year,
// and the widget's own `year` attribute picks which one is shown (see
// `selectYearTotals`), so the host's report params play no part here.
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AnnualHighlightsWidgetProps = WidgetRenderProps< AnnualHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Resolves the totals for the selected year. A year the site did not publish
 * in has no row; leaving it undefined shows the empty state rather than a
 * screen of zeros.
 */
function selectYearTotals(
	data: StatsInsightsResponse | undefined,
	selectedYear: number
): StatsInsightsYear | undefined {
	// `years` can be absent: the sanitizer returns a bare object for a payload
	// it does not recognize.
	return data?.years?.find( year => Number( year.year ) === selectedYear );
}

/**
 * Fetches the insights report through the designated `useStatsInsights` Stats
 * hook and renders the totals for the selected year as a `MetricTileGrid` (see
 * `selectYearTotals`). The endpoint returns every year in one request, so
 * switching years is a client-side row pick — no new fetch. The insights
 * module has no comparison period, so each tile shows a bare formatted count.
 */
function AnnualHighlightsReport( { year }: { year?: YearPresetId } ) {
	const { data, isLoading, isFetching, isError, refetch } = useStatsInsights();
	const totals = selectYearTotals( data, resolveSelectedYear( year ) );

	// Guarded on `totals`: the tile values read the selected year, which is
	// absent in the loading / error / empty states handled by <WidgetState>.
	const tiles = totals
		? [
				{
					key: 'posts',
					icon: postList,
					label: __( 'Posts', 'jetpack-premium-analytics-pkg' ),
					value: totals.total_posts,
				},
				{
					key: 'words',
					icon: paragraph,
					label: __( 'Words', 'jetpack-premium-analytics-pkg' ),
					value: totals.total_words,
				},
				{
					key: 'likes',
					icon: starEmpty,
					label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
					value: totals.total_likes,
				},
				{
					key: 'comments',
					icon: comment,
					label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
					value: totals.total_comments,
				},
		  ]
		: [];

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the highlights visible; only surface the
				// error when there is nothing to show.
				isError={ ! totals && isError }
				isEmpty={ ! totals }
				error={ {
					description: __(
						"We couldn't load your year in review. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No highlights for this year.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <AnnualHighlightsSkeleton /> }
			>
				{ totals && (
					<Stack className={ styles.root } direction="column">
						<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
					</Stack>
				) }
			</WidgetState>
			<WidgetFooter className={ styles.footer }>
				<ReportLink report="annual-insights" />
			</WidgetFooter>
		</div>
	);
}

/**
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded per the widget contract, though
 * the report ignores report params: the year shown comes from the widget's own
 * `year` attribute, which the host renders as a dropdown in the frame header.
 */
export default function AnnualHighlights( { attributes = {} }: AnnualHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport year={ attributes.year } />
		</WidgetRoot>
	);
}
