import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { formatWatchTime } from '../../utils/format';
import KpiCard from '../stats/kpi-card';
import './style.scss';
import type { VideoMetric, VideoStats } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	stats: VideoStats;
	isLoading: boolean;
	activeMetric: VideoMetric;
	onChangeActiveMetric: ( next: VideoMetric ) => void;
	tabIds: Record< VideoMetric, string >;
	panelId: string;
};

const NUMBER_FORMATTER = new Intl.NumberFormat();
const PERCENT_FORMATTER = new Intl.NumberFormat( undefined, { maximumFractionDigits: 1 } );

/**
 * Locale-aware integer formatter: 1234 → "1,234".
 *
 * @param n - Integer to format.
 * @return Localized digit grouping.
 */
function formatNumber( n: number ): string {
	return NUMBER_FORMATTER.format( n );
}

/**
 * Format a retention rate (percentage points, as WPCOM reports it):
 * 87.5 → "87.5%".
 *
 * @param rate - Retention rate in percentage points.
 * @return Localized percent string.
 */
function formatRetention( rate: number ): string {
	return `${ PERCENT_FORMATTER.format( rate ) }%`;
}

/**
 * Four KPI cards (Views, Impressions, Watch time, Retention) for the
 * per-video Analytics screen. Same WAI-ARIA tablist pattern as the
 * Overview's `KpiCardsRow`: each card is a tab selecting what the
 * trends panel shows. Retention has no time series upstream, so the
 * screen renders an explanatory panel — not the chart — when that tab
 * is active; the tab itself behaves like the others. Layout grid and
 * active-tab indicator live in `./style.scss` under
 * `.vp-video-analytics__kpi-row`.
 *
 * @param props                      - Component props.
 * @param props.stats                - Per-video stats (KPI summaries).
 * @param props.isLoading            - When true, KPI values render as skeletons.
 * @param props.activeMetric         - Currently selected KPI.
 * @param props.onChangeActiveMetric - Called with the next KPI when a card is activated.
 * @param props.tabIds               - Stable DOM ids for each tab, used by the panel's `aria-labelledby`.
 * @param props.panelId              - Id of the trends tabpanel; each tab points to it via `aria-controls`.
 * @return The row element.
 */
export default function KpiCardsRow( {
	stats,
	isLoading,
	activeMetric,
	onChangeActiveMetric,
	tabIds,
	panelId,
}: Props ): ReactElement {
	const onSelectViews = useCallback(
		() => onChangeActiveMetric( 'views' ),
		[ onChangeActiveMetric ]
	);
	const onSelectImpressions = useCallback(
		() => onChangeActiveMetric( 'impressions' ),
		[ onChangeActiveMetric ]
	);
	const onSelectWatchTime = useCallback(
		() => onChangeActiveMetric( 'watch_time' ),
		[ onChangeActiveMetric ]
	);
	const onSelectRetention = useCallback(
		() => onChangeActiveMetric( 'retention' ),
		[ onChangeActiveMetric ]
	);

	return (
		<div
			className="vp-video-analytics__kpi-row"
			role="tablist"
			aria-orientation="horizontal"
			aria-label={ __( 'Active metric', 'jetpack-videopress-pkg' ) }
		>
			<KpiCard
				label={ __( 'VIEWS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( stats.views.current ) }
				summary={ stats.views }
				isLoading={ isLoading }
				isActive={ activeMetric === 'views' }
				onSelect={ onSelectViews }
				id={ tabIds.views }
				controlsId={ panelId }
			/>
			<KpiCard
				label={ __( 'IMPRESSIONS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( stats.impressions.current ) }
				summary={ stats.impressions }
				isLoading={ isLoading }
				isActive={ activeMetric === 'impressions' }
				onSelect={ onSelectImpressions }
				id={ tabIds.impressions }
				controlsId={ panelId }
			/>
			<KpiCard
				label={ __( 'WATCH TIME', 'jetpack-videopress-pkg' ) }
				value={ formatWatchTime( stats.watchTimeSeconds.current ) }
				summary={ stats.watchTimeSeconds }
				isLoading={ isLoading }
				isActive={ activeMetric === 'watch_time' }
				onSelect={ onSelectWatchTime }
				id={ tabIds.watch_time }
				controlsId={ panelId }
			/>
			<KpiCard
				label={ __( 'RETENTION', 'jetpack-videopress-pkg' ) }
				value={ formatRetention( stats.retentionRate.current ) }
				summary={ stats.retentionRate }
				isLoading={ isLoading }
				isActive={ activeMetric === 'retention' }
				onSelect={ onSelectRetention }
				id={ tabIds.retention }
				controlsId={ panelId }
			/>
		</div>
	);
}
