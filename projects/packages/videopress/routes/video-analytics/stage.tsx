import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useParams } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import DateRangeSelector from '../../src/dashboard/components/stats/date-range-selector';
import StatsErrorCard from '../../src/dashboard/components/stats/stats-error-card';
import ViewsTrendsCard from '../../src/dashboard/components/stats/views-trends-card';
import ChannelAverageCard from '../../src/dashboard/components/video-analytics/channel-average-card';
import KpiCardsRow from '../../src/dashboard/components/video-analytics/kpi-cards-row';
import PagesCard from '../../src/dashboard/components/video-analytics/pages-card';
import RetentionPanel from '../../src/dashboard/components/video-analytics/retention-panel';
import VideoLayout from '../../src/dashboard/components/video-layout';
import { useChannelAverages, useVideoStats } from '../../src/dashboard/hooks/use-stats';
import { useVideo } from '../../src/dashboard/hooks/use-video';
import { useVideoPages } from '../../src/dashboard/hooks/use-video-pages';
import { isStudioEnabled } from '../../src/dashboard/utils/studio';
import './style.scss';
import type { LibraryItem } from '../../src/dashboard/types/library';
import type {
	ChartCompare,
	DateRange,
	Granularity,
	VideoMetric,
} from '../../src/dashboard/types/stats';

// Stable ids wiring the KPI tablist to the trends tabpanel via ARIA,
// mirroring the Overview's KPI row / chart pairing. All four tabs —
// including Retention, whose panel is an explanatory state rather than
// the chart — point at the same panel id.
const TRENDS_PANEL_ID = 'vp-video-analytics-trends-panel';
const KPI_TAB_IDS: Record< VideoMetric, string > = {
	views: 'vp-video-analytics-kpi-tab-views',
	impressions: 'vp-video-analytics-kpi-tab-impressions',
	watch_time: 'vp-video-analytics-kpi-tab-watch-time',
	retention: 'vp-video-analytics-kpi-tab-retention',
};

// Only VideoPress videos have WPCOM stats; local library items don't
// exist upstream, so they get the not-found state like an invalid id.
const hasAnalytics = ( item: LibraryItem ): boolean => item.type === 'videopress';

// Deep-link fallback for when the feature flag is off, the id doesn't
// resolve, or the item is a local (non-VideoPress) upload. The flag also
// strips this route from the server-side registry, so the flag-off case
// only renders in edge cases (e.g. a stale client); mirrors
// routes/video/stage.tsx's NotFound.
const NotFound = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'VideoPress', to: '/library' },
					{ label: __( 'Not found', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-video-analytics vp-video-analytics__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that page.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

// Placeholder shown while /wp/v2/media/{id} is in flight. Mirrors the
// details screen's Loading: the AdminPage + breadcrumbs shell stays
// present rather than blanking the viewport for the duration of the fetch.
const Loading = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'VideoPress', to: '/library' },
					{ label: __( 'Loading…', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-video-analytics vp-video-analytics__loading" aria-busy="true" />
	</AdminPage>
);

// No-data-yet state: the backend is still transcoding, so WPCOM has no
// stats to show. `useVideo` polls while `isProcessing`, so this state
// resolves into the real screen without a manual reload — the same
// pattern the details screen's thumbnail uses.
const Processing = ( { video }: { video: LibraryItem } ) => (
	<VideoLayout
		videoId={ video.id }
		activeTab="analytics"
		breadcrumbLabel={ video.title || __( 'Analytics', 'jetpack-videopress-pkg' ) }
	>
		<div className="vp-video-analytics">
			<div className="vp-video-analytics__processing">
				<Text>
					{ __(
						'This video is still processing. Analytics will appear once it’s ready.',
						'jetpack-videopress-pkg'
					) }
				</Text>
			</div>
		</div>
	</VideoLayout>
);

const Ready = ( { video }: { video: LibraryItem } ) => {
	// UI state is screen-owned (unlike the Overview, where useStats owns
	// it): the per-video hooks take the range/granularity as arguments so
	// the same fetched windows can feed both the per-video shape and the
	// channel averages.
	const [ dateRange, setDateRange ] = useState< DateRange >( 'last_30_days' );
	const [ granularity, setGranularity ] = useState< Granularity >( 'days' );
	const [ activeMetric, setActiveMetricRaw ] = useState< VideoMetric >( 'views' );
	const [ compare, setCompare ] = useState< ChartCompare >( 'secondary_and_previous_period' );

	const { stats, isLoading, isError } = useVideoStats( video.id, dateRange, granularity );
	// Same current-window query as useVideoStats (shared cache entry), so
	// the comparison card adds no request.
	const {
		averages,
		isLoading: isChannelLoading,
		isError: isChannelError,
	} = useChannelAverages( dateRange );
	// Deliberately not scoped to the header's DateRangeSelector: upstream
	// `pages[]` is a cumulative list of posts embedding the video, not a
	// range-windowed metric, so the default period=day&num=30 window is
	// used regardless of the selected range.
	const { pages, isLoading: arePagesLoading, isError: isPagesError } = useVideoPages( video.id );

	// When Watch time becomes the active metric, compares against the
	// other count metrics stop making sense (no shared unit); fall back
	// to previous-period, matching useStats' behavior on the Overview.
	const setActiveMetric = useCallback( ( next: VideoMetric ) => {
		setActiveMetricRaw( next );
		if ( next === 'watch_time' ) {
			setCompare( 'previous_period' );
		}
	}, [] );

	return (
		<VideoLayout
			videoId={ video.id }
			activeTab="analytics"
			breadcrumbLabel={ video.title || __( 'Analytics', 'jetpack-videopress-pkg' ) }
			actions={ <DateRangeSelector value={ dateRange } onChange={ setDateRange } /> }
		>
			<div className="vp-video-analytics">
				{ isError ? (
					// A failed window degrades `stats` to zeros indistinguishable
					// from a genuinely zero-view video, so the KPI/chart region is
					// replaced outright rather than rendering misleading zeros.
					<StatsErrorCard />
				) : (
					<>
						<KpiCardsRow
							stats={ stats }
							isLoading={ isLoading }
							activeMetric={ activeMetric }
							onChangeActiveMetric={ setActiveMetric }
							tabIds={ KPI_TAB_IDS }
							panelId={ TRENDS_PANEL_ID }
						/>
						{ activeMetric === 'retention' ? (
							// Retention has no time series upstream (WPCOM reports only a
							// per-day scalar), so the chart is replaced by an explanatory
							// panel; the weighted KPI in the card above stays visible.
							<RetentionPanel panelId={ TRENDS_PANEL_ID } activeTabId={ KPI_TAB_IDS.retention } />
						) : (
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
						) }
					</>
				) }
				<div className="vp-video-analytics__row--bottom">
					<PagesCard pages={ pages } isLoading={ arePagesLoading } isError={ isPagesError } />
					<ChannelAverageCard
						stats={ stats }
						channel={ averages }
						isLoading={ isLoading || isChannelLoading }
						isError={ isError || isChannelError }
					/>
				</div>
			</div>
		</VideoLayout>
	);
};

const AnalyticsRoute = ( { id }: { id: string } ) => {
	const { video, isLoading } = useVideo( id );

	if ( isLoading ) {
		return <Loading />;
	}

	if ( ! video || ! hasAnalytics( video ) ) {
		return <NotFound />;
	}

	if ( video.isProcessing ) {
		return <Processing video={ video } />;
	}

	return <Ready video={ video } />;
};

const StageInner = () => {
	const { id } = useParams( { from: '/video/$id/analytics' } );

	if ( ! isStudioEnabled() ) {
		return <NotFound />;
	}

	return <AnalyticsRoute id={ id } />;
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
