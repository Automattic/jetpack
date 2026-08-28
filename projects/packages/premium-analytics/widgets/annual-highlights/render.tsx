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

// The insights endpoint is not period-scoped: one request returns every year and
// the widget's own `year` attribute picks one, so host report params play no part.
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AnnualHighlightsWidgetProps = WidgetRenderProps< AnnualHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A year the site did not publish in has no row; leaving it undefined shows the
 * empty state rather than a screen of zeros.
 */
function selectYearTotals(
	data: StatsInsightsResponse | undefined,
	selectedYear: number
): StatsInsightsYear | undefined {
	// `years` can be absent: the sanitizer returns a bare object for a payload
	// it does not recognize.
	return data?.years?.find( year => Number( year.year ) === selectedYear );
}

function AnnualHighlightsReport( { year }: { year?: YearPresetId } ) {
	const { data, isLoading, isFetching, isError, refetch } = useStatsInsights();
	const totals = selectYearTotals( data, resolveSelectedYear( year ) );

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
				// `placeholderData` keeps the last highlights on screen, so a transient
				// refetch failure should not replace them with an error.
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

export default function AnnualHighlights( { attributes = {} }: AnnualHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport year={ attributes.year } />
		</WidgetRoot>
	);
}
