/**
 * External dependencies
 */
import { megaphone } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useWordAdsChart, { type WordAdsPeriod } from './use-wordads-chart';
import type { WordAdsChartTabsAttributes, WordAdsChartTabsGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type WordAdsChartTabsRenderAttributes = WordAdsChartTabsAttributes &
	Partial< ReportParamsFieldAttributes >;
type WordAdsChartTabsWidgetProps = WidgetRenderProps< WordAdsChartTabsRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires. Unlike the
// traffic and subscribers charts, this dropdown offers year.
const WORDADS_PERIODS = [
	'day',
	'week',
	'month',
	'year',
] as const satisfies readonly WordAdsPeriod[];

type WordAdsChartTabsInnerProps = {
	/**
	 * Selected granularity; `auto` follows the dashboard range.
	 */
	granularity: WordAdsChartTabsGranularity;
};

/**
 * The "Group by" control is the `granularity` attribute (`relevance: 'high'`),
 * rendered by the widget host; it only chooses the bucket size within the
 * dashboard range. Which metric is plotted is the chart's own tab selection.
 */
function WordAdsChartTabsInner( { granularity }: WordAdsChartTabsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// `auto` means "follow the dashboard range"; an explicit value sticks
	// across range changes, so a wide range doesn't stay stuck on `day`
	// granularity (and blow up the bucket count) while the user hasn't picked
	// a granularity themselves.
	const period: WordAdsPeriod =
		granularity === 'auto'
			? defaultPeriodForInterval( reportParams.interval, WORDADS_PERIODS )
			: granularity;

	const { metrics, isLoading, isFetching, isError, isEmpty, refetch } = useWordAdsChart(
		reportParams,
		period
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ isEmpty }
				error={ {
					description: __(
						"We couldn't load WordAds data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: megaphone,
					description: __( 'No WordAds data in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				// The chart is the whole content here, so its block replaces the generic
				// stacked lines.
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ DATA_FORMAT }
					groupLabel={ __( 'WordAds metric', 'jetpack-premium-analytics-pkg' ) }
				/>
			</WidgetState>
		</div>
	);
}

export default function WordAdsChartTabs( { attributes = {} }: WordAdsChartTabsWidgetProps ) {
	const granularity = attributes.granularity ?? 'auto';

	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<WordAdsChartTabsInner granularity={ granularity } />
		</WidgetRoot>
	);
}
