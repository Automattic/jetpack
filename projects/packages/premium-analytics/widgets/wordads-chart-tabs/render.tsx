/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { getDefaultReportParams } from '@jetpack-premium-analytics/fields';
import { megaphone } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useWordAdsChart, { type WordAdsPeriod } from './use-wordads-chart';
import type { WordAdsChartTabsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type WordAdsChartTabsWidgetProps = WidgetRenderProps< WordAdsChartTabsAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires. Unlike the
// traffic and subscribers charts, this one supports year.
const WORDADS_PERIODS = [
	'day',
	'week',
	'month',
	'year',
] as const satisfies readonly WordAdsPeriod[];

function WordAdsChartTabsInner() {
	const { reportParams } = useWidgetRootContext();
	const period: WordAdsPeriod = defaultPeriodForInterval( reportParams.interval, WORDADS_PERIODS );

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
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ DATA_FORMAT }
					groupLabel={ __( 'WordAds metric', 'jetpack-premium-analytics-pkg' ) }
					pointsAreWallClocks
				/>
			</WidgetState>
		</div>
	);
}

export default function WordAdsChartTabs( { attributes = {} }: WordAdsChartTabsWidgetProps ) {
	// Unsaved instances must not fall back to the section's URL date range.
	const defaultReportParams = useMemo( getDefaultReportParams, [] );
	const reportParams = attributes.reportParams ?? defaultReportParams;

	return (
		// Scope the widget body before WidgetRoot strips the unsupported
		// comparison parameters. The header control is host chrome outside this
		// tree; it takes its scope from the section provider.
		<ReportScopeProvider offersComparison={ false }>
			<WidgetRoot attributes={ { ...attributes, reportParams } }>
				<WordAdsChartTabsInner />
			</WidgetRoot>
		</ReportScopeProvider>
	);
}
