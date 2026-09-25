/**
 * External dependencies
 */
import {
	type ChartDisplayChartType,
	chartInterval,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	ReportScopeProvider,
	useWidgetRootContext,
	WidgetRoot,
	WidgetState,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { megaphone } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { DEFAULT_REPORT_PARAMS } from './default-report-params';
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
						'jetpack-wordads-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-wordads-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: megaphone,
					description: __( 'No WordAds data in this period.', 'jetpack-wordads-analytics-pkg' ),
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					groupLabel={ __( 'WordAds metric', 'jetpack-wordads-analytics-pkg' ) }
					// As the classic chart: one hover reads out all three, whichever tab is up.
					tooltipMetrics="all"
				/>
			</WidgetState>
		</div>
	);
}

export default function WordAdsChartTabs( { attributes = {} }: WordAdsChartTabsWidgetProps ) {
	// Unsaved instances must not fall back to the section's URL date range.
	const reportParams = attributes.reportParams ?? DEFAULT_REPORT_PARAMS;

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
