import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import DateRangeSelector from '../../src/dashboard/components/overview/date-range-selector';
import FreeTierNotice from '../../src/dashboard/components/overview/free-tier-notice';
import KpiCardsRow from '../../src/dashboard/components/overview/kpi-cards-row';
import MostViewedCard from '../../src/dashboard/components/overview/most-viewed-card';
import StorageMeterCard from '../../src/dashboard/components/overview/storage-meter-card';
import TopByWatchTimeCard from '../../src/dashboard/components/overview/top-by-watch-time-card';
import ViewsTrendsCard from '../../src/dashboard/components/overview/views-trends-card';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useStats } from '../../src/dashboard/hooks/use-stats';
import './style.scss';
import type { ActiveMetric } from '../../src/dashboard/types/stats';

// Stable ids that wire the KPI tablist to the chart tabpanel via ARIA.
// Defined here so both children agree without a separate constants file.
const TRENDS_PANEL_ID = 'vp-overview-trends-panel';
const KPI_TAB_IDS: Record< ActiveMetric, string > = {
	views: 'vp-overview-kpi-tab-views',
	impressions: 'vp-overview-kpi-tab-impressions',
	watch_time: 'vp-overview-kpi-tab-watch-time',
};

const StageInner = () => {
	const {
		stats,
		isLoading,
		dateRange,
		setDateRange,
		granularity,
		setGranularity,
		activeMetric,
		setActiveMetric,
		compare,
		setCompare,
	} = useStats();
	const { isFree, isAtomic, isUnlimited, videoCount } = useFreeTier();

	const showStorageMeter = ! isFree && videoCount > 0 && ! isUnlimited && ! isAtomic;

	return (
		<DashboardLayout
			activeTab="overview"
			actions={ <DateRangeSelector value={ dateRange } onChange={ setDateRange } /> }
		>
			<div className="vp-overview">
				{ isFree && <FreeTierNotice /> }
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
				{ showStorageMeter && <StorageMeterCard /> }
				<div className="vp-overview__row--bottom">
					<MostViewedCard videos={ stats.topVideos } isLoading={ isLoading } />
					<TopByWatchTimeCard videos={ stats.topVideosByWatchTime } isLoading={ isLoading } />
				</div>
			</div>
		</DashboardLayout>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
