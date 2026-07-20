import LocalDevModeBadge from '@automattic/jetpack-connection/local-dev-mode-badge';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { QueryClientProvider } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import FetchErrorNotice from '../../src/dashboard/components/fetch-error-notice';
import DateRangeSelector from '../../src/dashboard/components/overview/date-range-selector';
import FreeTierNotice from '../../src/dashboard/components/overview/free-tier-notice';
import KpiCardsRow from '../../src/dashboard/components/overview/kpi-cards-row';
import MostViewedCard from '../../src/dashboard/components/overview/most-viewed-card';
import StorageMeterCard from '../../src/dashboard/components/overview/storage-meter-card';
import TopByWatchTimeCard from '../../src/dashboard/components/overview/top-by-watch-time-card';
import ViewsTrendsCard from '../../src/dashboard/components/overview/views-trends-card';
import QueryClientWrapper, {
	getVideopressQueryClient,
} from '../../src/dashboard/components/query-client-wrapper';
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

const StageInner = ( { isOfflineMode = false }: { isOfflineMode?: boolean } ) => {
	const {
		stats,
		isLoading,
		isError,
		error: statsError,
		hasData,
		refetch,
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
	// A failed stats request would otherwise render as all-zero KPI cards —
	// indistinguishable from a genuine zero-activity site. Only when there's
	// no (cached) data behind it, though: a failed *background* refetch keeps
	// the stats already on screen instead of swapping them for the error pane.
	const statsUnavailable = isError && ! hasData;

	return (
		<DashboardLayout
			activeTab="overview"
			actions={
				<>
					{ isOfflineMode && <LocalDevModeBadge /> }
					<DateRangeSelector value={ dateRange } onChange={ setDateRange } />
				</>
			}
		>
			<div className="vp-overview">
				{ isFree && <FreeTierNotice /> }
				{ statsUnavailable ? (
					<FetchErrorNotice
						className="vp-overview__error"
						message={ __( 'We couldn’t load your video stats.', 'jetpack-videopress-pkg' ) }
						error={ statsError }
						onRetry={ () => refetch() }
					/>
				) : (
					<>
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
					</>
				) }
				{ /* Storage isn't stats-derived (it sources its own data via
				     useSite), so a stats failure doesn't take it down. */ }
				{ showStorageMeter && <StorageMeterCard /> }
				{ ! statsUnavailable && (
					<div className="vp-overview__row--bottom">
						<MostViewedCard videos={ stats.topVideos } isLoading={ isLoading } />
						<TopByWatchTimeCard videos={ stats.topVideosByWatchTime } isLoading={ isLoading } />
					</div>
				) }
			</div>
		</DashboardLayout>
	);
};

const Stage = () => {
	const { offlineMode } = useConnection();
	const isOfflineMode = Boolean( offlineMode?.isActive );

	// Local development mode sites are never "connected" (the handshake needs
	// WordPress.com to reach back to this site), so `ConnectionGate` -- which
	// `QueryClientWrapper` wraps every route in, including this one -- would
	// otherwise block the page. Its underlying data is mocked server-side
	// (see REST_Controller::get_stats_video_plays()), so the real dashboard is
	// safe to render directly here, bypassing the gate rather than the whole
	// page. Reuses the same shared QueryClient singleton as the gated path.
	if ( isOfflineMode ) {
		return (
			<QueryClientProvider client={ getVideopressQueryClient() }>
				<StageInner isOfflineMode />
			</QueryClientProvider>
		);
	}

	return (
		<QueryClientWrapper>
			<StageInner />
		</QueryClientWrapper>
	);
};

export { Stage as stage };
