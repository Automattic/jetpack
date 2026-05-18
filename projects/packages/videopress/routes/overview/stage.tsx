import DashboardLayout from '../../src/dashboard/components/DashboardLayout';
import DateRangeSelector from '../../src/dashboard/components/Overview/date-range-selector';
import FreeTierNotice from '../../src/dashboard/components/Overview/free-tier-notice';
import KpiCardsRow from '../../src/dashboard/components/Overview/kpi-cards-row';
import MostViewedCard from '../../src/dashboard/components/Overview/most-viewed-card';
import StorageMeterCard from '../../src/dashboard/components/Overview/storage-meter-card';
import TopByWatchTimeCard from '../../src/dashboard/components/Overview/top-by-watch-time-card';
import ViewsTrendsCard from '../../src/dashboard/components/Overview/views-trends-card';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useMockStats } from '../../src/dashboard/hooks/use-mock-stats';
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

const Stage = () => {
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
	} = useMockStats();
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
				{ showStorageMeter && <StorageMeterCard usedBytes={ stats.storageUsedBytes } /> }
				<div className="vp-overview__row--bottom">
					<MostViewedCard videos={ stats.topVideos } isLoading={ isLoading } />
					<TopByWatchTimeCard videos={ stats.topVideosByWatchTime } isLoading={ isLoading } />
				</div>
			</div>
		</DashboardLayout>
	);
};

export { Stage as stage };
