/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { megaphone } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useWordAdsChart, { type WordAdsPeriod } from './use-wordads-chart';
import type { WordAdsChartTabsAttributes } from './widget';
import type { FunctionComponent } from 'react';
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

/**
 * The date range and bucket size are this widget's own: the Ads section header
 * offers no date control, because the section's four other widgets read an
 * endpoint that takes no dates at all. The controls still write the shared URL
 * search params, so the picker and the chart read one source — see the
 * single-source-of-truth constraint in the WOOA7S-1979 design.
 */
function WordAdsChartTabsInner() {
	const { reportParams } = useWidgetRootContext();
	// Unlike `WidgetRoot`'s `useSearch( { strict: false } )`, `useReportDateFilters`
	// requires a real matched route and throws without one. Hardcoding '/' is
	// safe because this widget only ever mounts on the `/` dashboard route.
	const dateFilters = useReportDateFilters( '/' );
	const period: WordAdsPeriod = defaultPeriodForInterval( reportParams.interval, WORDADS_PERIODS );

	const { metrics, isLoading, isFetching, isError, isEmpty, refetch } = useWordAdsChart(
		reportParams,
		period
	);

	return (
		<div className={ styles.root }>
			<div className={ styles.controls }>
				<DateFiltersPanel { ...dateFilters } withIntervalControl />
			</div>

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

// Declared through the props type but taking none: the host still passes
// `attributes`, and dropping them at the signature is what keeps them from
// reaching `WidgetRoot`.
const WordAdsChartTabs: FunctionComponent< WordAdsChartTabsWidgetProps > = () => {
	return (
		// The chart has no comparison series to draw, so it must never offer one —
		// regardless of what the hosting section declares. Outside `WidgetRoot` so
		// the scope is already set when it strips the comparison search params.
		<ReportScopeProvider offersComparison={ false }>
			{ /*
			 * No `attributes` forwarded on purpose: `WidgetRoot` prefers injected
			 * report params over the URL, which would leave this widget's own
			 * controls writing one source while the chart read another. Passing
			 * nothing is what keeps the two on the URL.
			 */ }
			<WidgetRoot attributes={ {} }>
				<WordAdsChartTabsInner />
			</WidgetRoot>
		</ReportScopeProvider>
	);
};

export default WordAdsChartTabs;
