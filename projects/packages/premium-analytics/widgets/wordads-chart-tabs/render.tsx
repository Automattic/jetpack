/**
 * External dependencies
 */
import { megaphone } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
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
import { type WordAdsChartMetricId } from './metrics';
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
	/**
	 * WordAds metrics to show as tabs; `undefined` shows all.
	 */
	metricIds?: WordAdsChartMetricId[];
};

/**
 * WordAds chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()` and hands the per-metric tabs (Ads
 * Served, Average CPM, Revenue) to the shared `MetricTabsChart`, with the
 * loading/error/empty states rendered through `WidgetState`. The "Group by"
 * control is the `granularity` attribute (`relevance: 'high'`) and the tab set
 * is the `metrics` attribute (`relevance: 'high'`), both rendered by the widget
 * host; granularity only chooses the bucket size within the dashboard range.
 *
 * @param {WordAdsChartTabsInnerProps} props - The component props.
 * @return The widget body.
 */
function WordAdsChartTabsInner( { granularity, metricIds }: WordAdsChartTabsInnerProps ) {
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
		period,
		metricIds
	);

	// No metric selected: skip the data-driven states and show a distinct empty state.
	const noMetricSelected = metrics.length === 0;

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ noMetricSelected ? false : isLoading }
				isFetching={ noMetricSelected ? false : isFetching }
				isError={ noMetricSelected ? false : isError }
				isEmpty={ noMetricSelected || isEmpty }
				error={ {
					description: __(
						"We couldn't load WordAds data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: megaphone,
					description: noMetricSelected
						? __( 'Select at least one metric to display.', 'jetpack-premium-analytics-pkg' )
						: __( 'No WordAds data in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
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

/**
 * Widget render entry point.
 *
 * `WidgetRoot` provides the analytics query client and resolves the dashboard's
 * `reportParams`; the inner component reads that range/comparison state. The
 * granularity is the `granularity` attribute and the visible tabs are the
 * `metrics` attribute (both `relevance: 'high'`), exposed as controls by the
 * widget host.
 *
 * @param {WordAdsChartTabsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function WordAdsChartTabs( { attributes = {} }: WordAdsChartTabsWidgetProps ) {
	const granularity = attributes.granularity ?? 'auto';

	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<WordAdsChartTabsInner granularity={ granularity } metricIds={ attributes.metrics } />
		</WidgetRoot>
	);
}
