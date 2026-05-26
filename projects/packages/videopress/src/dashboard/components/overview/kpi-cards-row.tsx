import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { formatWatchTime } from '../../utils/format';
import KpiCard from './kpi-card';
import type { ActiveMetric, OverviewStats } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	views: OverviewStats[ 'views' ];
	impressions: OverviewStats[ 'impressions' ];
	watchTimeSeconds: OverviewStats[ 'watchTimeSeconds' ];
	isLoading: boolean;
	activeMetric: ActiveMetric;
	onChangeActiveMetric: ( next: ActiveMetric ) => void;
	tabIds: Record< ActiveMetric, string >;
	panelId: string;
};

const NUMBER_FORMATTER = new Intl.NumberFormat();

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
 * Three KPI cards (Views, Impressions, Watch time) in a responsive grid.
 * Each card acts as a tab that selects which metric the Views trends
 * chart plots; together they form a WAI-ARIA tablist. Layout grid is
 * owned by the parent `.vp-overview__kpi-row` rule in
 * `routes/overview/style.scss`.
 *
 * @param props                      - Component props.
 * @param props.views                - Views summary.
 * @param props.impressions          - Impressions summary.
 * @param props.watchTimeSeconds     - Watch-time summary in seconds.
 * @param props.isLoading            - When true, KPI values render as em dashes.
 * @param props.activeMetric         - Currently selected chart metric.
 * @param props.onChangeActiveMetric - Called with the next metric when a card is activated.
 * @param props.tabIds               - Stable DOM ids for each tab, used by the chart's `aria-labelledby`.
 * @param props.panelId              - Id of the chart tabpanel; each tab points to it via `aria-controls`.
 * @return The row element.
 */
export default function KpiCardsRow( {
	views,
	impressions,
	watchTimeSeconds,
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

	return (
		<div
			className="vp-overview__kpi-row"
			role="tablist"
			aria-orientation="horizontal"
			aria-label={ __( 'Active metric', 'jetpack-videopress-pkg' ) }
		>
			<KpiCard
				label={ __( 'VIEWS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( views.current ) }
				summary={ views }
				isLoading={ isLoading }
				isActive={ activeMetric === 'views' }
				onSelect={ onSelectViews }
				id={ tabIds.views }
				controlsId={ panelId }
			/>
			<KpiCard
				label={ __( 'IMPRESSIONS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( impressions.current ) }
				summary={ impressions }
				isLoading={ isLoading }
				isActive={ activeMetric === 'impressions' }
				onSelect={ onSelectImpressions }
				id={ tabIds.impressions }
				controlsId={ panelId }
			/>
			<KpiCard
				label={ __( 'WATCH TIME', 'jetpack-videopress-pkg' ) }
				value={ formatWatchTime( watchTimeSeconds.current ) }
				summary={ watchTimeSeconds }
				isLoading={ isLoading }
				isActive={ activeMetric === 'watch_time' }
				onSelect={ onSelectWatchTime }
				id={ tabIds.watch_time }
				controlsId={ panelId }
			/>
		</div>
	);
}
