/**
 * External dependencies
 */
import {
	useStatsInsights,
	type StatsInsightsResponse,
	type StatsInsightsYear,
} from '@jetpack-premium-analytics/data';
import {
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
import { Stack, Text } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { type AnnualHighlightMetric, type AnnualHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The insights endpoint is not period-scoped, so the widget ignores the
// dashboard date range. Report params are still accepted at the WidgetRoot
// boundary (and Storybook may inject them) so the host contract holds.
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AnnualHighlightsWidgetProps = WidgetRenderProps< AnnualHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Picks the most recent year in the insights payload.
 *
 * @param data - The normalized insights response, or undefined while loading.
 * @return The latest year, or undefined when the payload carries none.
 */
function findLatestYear( data?: StatsInsightsResponse ): StatsInsightsYear | undefined {
	return ( data?.years ?? [] ).reduce< StatsInsightsYear | undefined >(
		( latest, candidate ) =>
			! latest || Number( candidate.year ) > Number( latest.year ) ? candidate : latest,
		undefined
	);
}

/**
 * Fetches the insights report through the designated `useStatsInsights` Stats
 * hook and renders the most recent year's totals as a `MetricTileGrid`. The
 * insights module has no comparison period, so each tile shows a bare formatted
 * count. Which tiles appear is controlled by the `metrics` attribute.
 *
 * @param {AnnualHighlightMetric[]} metrics - Enabled metric tile ids.
 * @return The widget content.
 */
function AnnualHighlightsReport( { metrics }: { metrics: AnnualHighlightMetric[] } ) {
	const { data, isLoading, isFetching, isError, refetch } = useStatsInsights();
	const enabledMetrics = useMemo( () => new Set( metrics ), [ metrics ] );

	const year = findLatestYear( data );

	// Guarded on `year`: the tile values read the latest year, which is absent
	// in the loading / error / empty states handled by <WidgetState>.
	const tiles = (
		year
			? [
					{
						key: 'posts',
						icon: postList,
						label: __( 'Posts', 'jetpack-premium-analytics-pkg' ),
						value: year.total_posts,
						enabled: enabledMetrics.has( 'posts' ),
					},
					{
						key: 'words',
						icon: paragraph,
						label: __( 'Words', 'jetpack-premium-analytics-pkg' ),
						value: year.total_words,
						enabled: enabledMetrics.has( 'words' ),
					},
					{
						key: 'likes',
						icon: starEmpty,
						label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
						value: year.total_likes,
						enabled: enabledMetrics.has( 'likes' ),
					},
					{
						key: 'comments',
						icon: comment,
						label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
						value: year.total_comments,
						enabled: enabledMetrics.has( 'comments' ),
					},
			  ]
			: []
	).filter( tile => tile.enabled );

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the highlights visible; only surface the
				// error when there is nothing to show.
				isError={ ! year && isError }
				isEmpty={ ! year }
				error={ {
					description: __(
						"We couldn't load annual highlights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No highlights to show yet.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				{ year && (
					<Stack className={ styles.root } direction="column" gap="lg">
						{ tiles.length === 0 ? (
							<Stack align="center" justify="center" className={ styles.placeholder }>
								<Text>
									{ __(
										'Select at least one metric to display.',
										'jetpack-premium-analytics-pkg'
									) }
								</Text>
							</Stack>
						) : (
							<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
						) }
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
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded so any injected report params are
 * preserved even though the insights endpoint is not period-scoped.
 *
 * @param {AnnualHighlightsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function AnnualHighlights( { attributes = {} }: AnnualHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
