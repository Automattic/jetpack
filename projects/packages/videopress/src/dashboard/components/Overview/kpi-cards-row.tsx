import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { formatWatchTime } from '../../utils/format';
import KpiCard from './kpi-card';
import type { ActiveMetric, OverviewStats } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	views: OverviewStats[ 'views' ];
	visitors: OverviewStats[ 'visitors' ];
	watchTimeSeconds: OverviewStats[ 'watchTimeSeconds' ];
	isLoading: boolean;
	activeMetric: ActiveMetric;
	onChangeActiveMetric: ( next: ActiveMetric ) => void;
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
 * Three KPI cards (Views, Visitors, Watch time) in a responsive grid.
 * Each card acts as a tab that selects which metric the Views trends
 * chart plots. Layout grid is owned by the parent `.vp-overview__kpi-row`
 * rule in `routes/overview/style.scss`.
 *
 * @param props                      - Component props.
 * @param props.views                - Views summary.
 * @param props.visitors             - Visitors summary.
 * @param props.watchTimeSeconds     - Watch-time summary in seconds.
 * @param props.isLoading            - When true, KPI values render as em dashes.
 * @param props.activeMetric         - Currently selected chart metric.
 * @param props.onChangeActiveMetric - Called with the next metric when a card is activated.
 * @return The row element.
 */
export default function KpiCardsRow( {
	views,
	visitors,
	watchTimeSeconds,
	isLoading,
	activeMetric,
	onChangeActiveMetric,
}: Props ): ReactElement {
	const onSelectViews = useCallback(
		() => onChangeActiveMetric( 'views' ),
		[ onChangeActiveMetric ]
	);
	const onSelectVisitors = useCallback(
		() => onChangeActiveMetric( 'visitors' ),
		[ onChangeActiveMetric ]
	);
	const onSelectWatchTime = useCallback(
		() => onChangeActiveMetric( 'watch_time' ),
		[ onChangeActiveMetric ]
	);

	return (
		<div className="vp-overview__kpi-row">
			<KpiCard
				label={ __( 'VIEWS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( views.current ) }
				summary={ views }
				isLoading={ isLoading }
				isActive={ activeMetric === 'views' }
				onSelect={ onSelectViews }
			/>
			<KpiCard
				label={ __( 'VISITORS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( visitors.current ) }
				summary={ visitors }
				isLoading={ isLoading }
				isActive={ activeMetric === 'visitors' }
				onSelect={ onSelectVisitors }
			/>
			<KpiCard
				label={ __( 'WATCH TIME', 'jetpack-videopress-pkg' ) }
				value={ formatWatchTime( watchTimeSeconds.current ) }
				summary={ watchTimeSeconds }
				isLoading={ isLoading }
				isActive={ activeMetric === 'watch_time' }
				onSelect={ onSelectWatchTime }
			/>
		</div>
	);
}
