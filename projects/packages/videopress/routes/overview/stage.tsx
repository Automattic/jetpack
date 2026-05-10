import DashboardLayout from '../../src/dashboard/components/DashboardLayout';
import DateRangeSelector from '../../src/dashboard/components/Overview/date-range-selector';
import KpiCardsRow from '../../src/dashboard/components/Overview/kpi-cards-row';
import MostViewedCard from '../../src/dashboard/components/Overview/most-viewed-card';
import TopLocationsCard from '../../src/dashboard/components/Overview/top-locations-card';
import ViewsTrendsCard from '../../src/dashboard/components/Overview/views-trends-card';
import { useMockStats } from '../../src/dashboard/hooks/use-mock-stats';
import './style.scss';

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

	return (
		<DashboardLayout
			activeTab="overview"
			actions={ <DateRangeSelector value={ dateRange } onChange={ setDateRange } /> }
		>
			<div className="vp-overview">
				<KpiCardsRow
					views={ stats.views }
					visitors={ stats.visitors }
					watchTimeSeconds={ stats.watchTimeSeconds }
					isLoading={ isLoading }
					activeMetric={ activeMetric }
					onChangeActiveMetric={ setActiveMetric }
				/>
				<ViewsTrendsCard
					series={ stats.series }
					activeMetric={ activeMetric }
					compare={ compare }
					granularity={ granularity }
					isLoading={ isLoading }
					onChangeCompare={ setCompare }
					onChangeGranularity={ setGranularity }
				/>
				<div className="vp-overview__row--bottom">
					<MostViewedCard videos={ stats.topVideos } isLoading={ isLoading } />
					<TopLocationsCard locations={ stats.topLocations } isLoading={ isLoading } />
				</div>
			</div>
		</DashboardLayout>
	);
};

export { Stage as stage };
