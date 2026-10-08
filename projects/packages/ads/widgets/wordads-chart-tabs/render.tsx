/**
 * External dependencies
 */
import {
	type ChartDisplayChartType,
	ChartEmptyState,
	chartInterval,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	ReportScopeProvider,
	useWidgetRootContext,
	WidgetRoot,
	WidgetState,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { defaultReportParams } from './default-report-params';
import { WORDADS_GRAIN } from './grain';
import styles from './style.module.css';
import useWordAdsChart, { type WordAdsPeriod } from './use-wordads-chart';
import type { WordAdsChartTabsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type WordAdsChartTabsWidgetProps = WidgetRenderProps< WordAdsChartTabsAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

function WordAdsChartTabsInner( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();
	// The window alone picks the bucket: one saved while the header still offered
	// a bucket control would otherwise stick with no way to change it.
	const period: WordAdsPeriod = chartInterval(
		{ ...reportParams, interval: undefined },
		WORDADS_GRAIN.periods
	);

	const { metrics, isLoading, isFetching, isError, refetch } = useWordAdsChart(
		reportParams,
		period
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				// A window without rows reaches the chart as tabs with no points, which it answers in the plot while the tabs keep showing their zeros.
				isEmpty={ false }
				error={ {
					description: __(
						"We couldn't load WordAds data. Please try again in a moment.",
						'jetpack-ads-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-ads-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					groupLabel={ __( 'WordAds metric', 'jetpack-ads-pkg' ) }
					// As the classic chart: one hover reads out all three, whichever tab is up.
					tooltipMetrics="all"
					empty={ <ChartEmptyState /> }
				/>
			</WidgetState>
		</div>
	);
}

export default function WordAdsChartTabs( { attributes = {} }: WordAdsChartTabsWidgetProps ) {
	// Unsaved instances must not fall back to the section's URL date range.
	const reportParams = attributes.reportParams ?? defaultReportParams();

	return (
		// Scope the widget body before WidgetRoot strips unsupported comparison params;
		// the header control is host chrome and takes its scope from the section provider.
		<ReportScopeProvider offersComparison={ false }>
			<WidgetRoot attributes={ { ...attributes, reportParams } }>
				<WordAdsChartTabsInner chartType={ attributes.chartType } />
			</WidgetRoot>
		</ReportScopeProvider>
	);
}
