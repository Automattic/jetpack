import { __ } from '@wordpress/i18n';
import KpiCard from './kpi-card';
import type { OverviewStats } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	views: OverviewStats[ 'views' ];
	visitors: OverviewStats[ 'visitors' ];
	watchTimeSeconds: OverviewStats[ 'watchTimeSeconds' ];
	isLoading: boolean;
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
 * Formats a watch-time duration in the largest unit that yields a value
 * ≥ 1, picking from hours / minutes / seconds. Hours show one decimal
 * place ("1.1 h") to match the Figma; smaller units are integers.
 *
 * @param seconds - Total seconds.
 * @return Compact human-readable duration.
 */
function formatWatchTime( seconds: number ): string {
	if ( seconds >= 3_600 ) {
		const hours = seconds / 3_600;
		return `${ hours.toFixed( 1 ) } h`;
	}
	if ( seconds >= 60 ) {
		return `${ Math.round( seconds / 60 ) } min`;
	}
	return `${ Math.round( seconds ) } s`;
}

/**
 * Three KPI cards (Views, Visitors, Watch time) in a responsive grid.
 * Layout grid is owned by the parent `.vp-overview__kpi-row` rule in
 * `routes/overview/style.scss`.
 *
 * @param props                  - Component props.
 * @param props.views            - Views summary.
 * @param props.visitors         - Visitors summary.
 * @param props.watchTimeSeconds - Watch-time summary in seconds.
 * @param props.isLoading        - When true, KPI values render as em dashes.
 * @return The row element.
 */
export default function KpiCardsRow( {
	views,
	visitors,
	watchTimeSeconds,
	isLoading,
}: Props ): ReactElement {
	return (
		<div className="vp-overview__kpi-row">
			<KpiCard
				label={ __( 'VIEWS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( views.current ) }
				summary={ views }
				isLoading={ isLoading }
			/>
			<KpiCard
				label={ __( 'VISITORS', 'jetpack-videopress-pkg' ) }
				value={ formatNumber( visitors.current ) }
				summary={ visitors }
				isLoading={ isLoading }
			/>
			<KpiCard
				label={ __( 'WATCH TIME', 'jetpack-videopress-pkg' ) }
				value={ formatWatchTime( watchTimeSeconds.current ) }
				summary={ watchTimeSeconds }
				isLoading={ isLoading }
			/>
		</div>
	);
}
