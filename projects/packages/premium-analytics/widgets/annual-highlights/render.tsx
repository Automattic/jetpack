/**
 * External dependencies
 */
import {
	useStatsInsights,
	type ReportPresetId,
	type StatsInsightsResponse,
	type StatsInsightsYear,
} from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME, getPresetYear } from '@jetpack-premium-analytics/datetime';
import {
	MetricTileGrid,
	ReportLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
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
import {
	DEFAULT_HIGHLIGHT_METRICS,
	type AnnualHighlightMetric,
	type AnnualHighlightsAttributes,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The insights endpoint is not period-scoped: one request returns every year,
// so the report params only pick which year is shown (see `selectTotals`).
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AnnualHighlightsWidgetProps = WidgetRenderProps< AnnualHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A subset of `StatsInsightsYear` rather than a row of it: all time is summed
 * from the yearly rows, and the averages and image counts carry no meaning
 * once years are added together.
 */
type AnnualHighlightTotals = Pick<
	StatsInsightsYear,
	'total_posts' | 'total_words' | 'total_likes' | 'total_comments'
>;

/**
 * Picks the most recent year in the insights payload.
 */
function findLatestYear( years: StatsInsightsYear[] ): StatsInsightsYear | undefined {
	return years.reduce< StatsInsightsYear | undefined >(
		( latest, candidate ) =>
			! latest || Number( candidate.year ) > Number( latest.year ) ? candidate : latest,
		undefined
	);
}

/**
 * Adds every year's totals together for the all-time selection.
 */
function sumYears( years: StatsInsightsYear[] ): AnnualHighlightTotals {
	return years.reduce< AnnualHighlightTotals >(
		( totals, year ) => ( {
			total_posts: totals.total_posts + year.total_posts,
			total_words: totals.total_words + year.total_words,
			total_likes: totals.total_likes + year.total_likes,
			total_comments: totals.total_comments + year.total_comments,
		} ),
		{ total_posts: 0, total_words: 0, total_likes: 0, total_comments: 0 }
	);
}

/**
 * Resolves the totals the section's date filter asks for.
 *
 * The Insights section offers all time and single years instead of a rolling
 * range, and that selection arrives as the report preset. Since the endpoint
 * returns every year at once, the selection picks a row here rather than
 * changing the request. Any other preset falls back to the most recent year.
 */
function selectTotals(
	data: StatsInsightsResponse | undefined,
	presetId: ReportPresetId | undefined
): AnnualHighlightTotals | undefined {
	const years = data?.years ?? [];
	if ( years.length === 0 ) {
		return undefined;
	}

	if ( presetId === PRESET_ALL_TIME ) {
		return sumYears( years );
	}

	const selectedYear = getPresetYear( presetId );
	if ( selectedYear !== null ) {
		// A year the site did not publish in has no row; leaving it undefined
		// shows the empty state rather than a screen of zeros.
		return years.find( year => Number( year.year ) === selectedYear );
	}

	return findLatestYear( years );
}

/**
 * Fetches the insights report through the designated `useStatsInsights` Stats
 * hook and renders the totals the section's date filter selects as a
 * `MetricTileGrid` (see `selectTotals`). The insights module has no comparison
 * period, so each tile shows a bare formatted count. Which tiles appear is
 * controlled by the `metrics` attribute.
 *
 * `metrics` defaults to the same list `example.attributes` declares, which is
 * what the settings UI shows for an instance carrying no attributes. Without
 * the default the two disagree: every metric reads as enabled in the control
 * while the body reports none selected. An explicit empty array still means
 * "none".
 */
function AnnualHighlightsReport( {
	metrics = DEFAULT_HIGHLIGHT_METRICS,
}: {
	metrics?: AnnualHighlightMetric[];
} ) {
	const { reportParams } = useWidgetRootContext();
	const { data, isLoading, isFetching, isError, refetch } = useStatsInsights();
	const enabledMetrics = useMemo( () => new Set( metrics ), [ metrics ] );

	const totals = selectTotals( data, reportParams.preset );

	// Guarded on `totals`: the tile values read the selected period, which is
	// absent in the loading / error / empty states handled by <WidgetState>.
	const tiles = (
		totals
			? [
					{
						key: 'posts',
						icon: postList,
						label: __( 'Posts', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_posts,
						enabled: enabledMetrics.has( 'posts' ),
					},
					{
						key: 'words',
						icon: paragraph,
						label: __( 'Words', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_words,
						enabled: enabledMetrics.has( 'words' ),
					},
					{
						key: 'likes',
						icon: starEmpty,
						label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_likes,
						enabled: enabledMetrics.has( 'likes' ),
					},
					{
						key: 'comments',
						icon: comment,
						label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_comments,
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
				isError={ ! totals && isError }
				isEmpty={ ! totals }
				error={ {
					description: __(
						"We couldn't load annual highlights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No highlights for this period.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				{ totals && (
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
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded so any injected report params are
 * preserved even though the insights endpoint is not period-scoped.
 */
export default function AnnualHighlights( { attributes = {} }: AnnualHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
