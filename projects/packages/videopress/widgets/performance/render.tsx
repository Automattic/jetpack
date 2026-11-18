/**
 * Internal dependencies
 */
import KpiCardsRow from '../../src/dashboard/components/overview/kpi-cards-row';
import ViewsTrendsCard from '../../src/dashboard/components/overview/views-trends-card';
import StatsWidget, { type StatsWidgetProps } from '../../src/dashboard/components/stats-widget';
import type { ActiveMetric } from '../../src/dashboard/types/stats';

// Stable ids that wire the KPI tablist to the chart tabpanel via ARIA.
const TRENDS_PANEL_ID = 'vp-overview-trends-panel';
const KPI_TAB_IDS: Record< ActiveMetric, string > = {
	views: 'vp-overview-kpi-tab-views',
	impressions: 'vp-overview-kpi-tab-impressions',
	watch_time: 'vp-overview-kpi-tab-watch-time',
};

/**
 * Video performance widget: the metric cards over the chart of the metric they select.
 *
 * @param {StatsWidgetProps} props - The props.
 * @return The widget.
 */
export default function Performance( props: StatsWidgetProps ) {
	return (
		<StatsWidget { ...props }>
			{ ( {
				stats,
				isLoading,
				activeMetric,
				setActiveMetric,
				compare,
				setCompare,
				granularity,
				setGranularity,
			} ) => (
				<div className="vp-overview__performance">
					<KpiCardsRow
						views={ stats.views }
						impressions={ stats.impressions }
						watchTimeSeconds={ stats.watchTimeSeconds }
						isLoading={ isLoading }
						activeMetric={ activeMetric }
						onChangeActiveMetric={ setActiveMetric }
						tabIds={ KPI_TAB_IDS }
						panelId={ TRENDS_PANEL_ID }
					/>
					<ViewsTrendsCard
						series={ stats.series }
						activeMetric={ activeMetric }
						compare={ compare }
						granularity={ granularity }
						isLoading={ isLoading }
						onChangeCompare={ setCompare }
						onChangeGranularity={ setGranularity }
						panelId={ TRENDS_PANEL_ID }
						activeTabId={ KPI_TAB_IDS[ activeMetric ] }
					/>
				</div>
			) }
		</StatsWidget>
	);
}
