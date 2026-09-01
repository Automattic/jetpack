import { DataPointDate } from '@automattic/charts';
import clsx from 'clsx';
import formatNumber from '../../utils/format-number';
import styles from './stats-chart-tooltip.module.scss';
import type { ReactElement, FC } from 'react';

interface TooltipPoint {
	key: string;
	value: number;
}

interface StatsChartTooltipProps {
	tooltipData?: {
		nearestDatum?: {
			datum: DataPointDate;
			key: string;
		};
		datumByKey?: { [ key: string ]: { datum: DataPointDate } };
	};
	metricIcon: ReactElement;
}

/**
 * Stats chart tooltip component for stats visualization.
 * @param {object} props             - Component props.
 * @param {object} props.tooltipData - Tooltip data from the chart library.
 * @param {object} props.metricIcon  - The icon JSX element for the selected metric.
 * @return {object} StatsChartTooltip React component.
 */
const StatsChartTooltip: FC< StatsChartTooltipProps > = ( { tooltipData, metricIcon } ) => {
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum || ! tooltipData ) {
		return null;
	}

	const tooltipPoints: TooltipPoint[] = Object.entries( tooltipData?.datumByKey || {} ).map(
		( [ key, { datum } ] ) => ( {
			key,
			value: datum.value,
		} )
	);

	const tooltipLabel: string =
		nearestDatum.label ||
		( nearestDatum.date &&
			new Date( nearestDatum.date ).toLocaleDateString( undefined, {
				month: 'short',
				day: 'numeric',
			} ) ) ||
		'';

	return (
		<div className={ styles[ 'stats-line-chart-tooltip' ] }>
			<div className={ clsx( styles[ 'module-content-list-item' ], styles[ 'is-date-label' ] ) }>
				{ tooltipLabel }
			</div>
			<ul>
				{ tooltipPoints.map( point => (
					<li key={ point.key } className={ clsx( styles[ 'module-content-list-item' ] ) }>
						<span className={ clsx( styles[ 'chart__tooltip-wrapper' ], styles.wrapper ) }>
							<span className={ clsx( styles[ 'chart__tooltip-label' ], styles.label ) }>
								<span className={ styles.gridicon }>{ metricIcon }</span>
								<span>{ point.key }</span>
							</span>
							<span className={ clsx( styles[ 'chart__tooltip-value' ], styles.value ) }>
								{ formatNumber( point.value ) }
							</span>
						</span>
					</li>
				) ) }
			</ul>
		</div>
	);
};

export default StatsChartTooltip;
