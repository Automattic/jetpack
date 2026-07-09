/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { MetricWithComparison, ComparativeLineChart } from '../../components';
import styles from './metric-comparison-widget.module.scss';
import type {
	ComparativeLineChartSeries,
	SeriesStyle,
} from '../../components/chart-comparative-line/types';
import type { DataFormat } from '../../types';

export type MetricComparisonWidgetProps = {
	/**
	 * Primary metric value
	 */
	value: number;

	/**
	 * Optional comparison metric (previous period, target, etc.)
	 */
	comparisonValue?: number | null;

	/**
	 * Chart display props
	 */
	series: ComparativeLineChartSeries[];

	/**
	 * Explicit styles for chart series. When provided, takes priority
	 * over styles defined in series[].options.
	 */
	seriesStyles?: SeriesStyle[];

	dataFormat: DataFormat;
	tickFormat?: string;
};

export function MetricComparisonWidget( {
	value,
	comparisonValue,
	series,
	seriesStyles,
	dataFormat,
	tickFormat,
}: MetricComparisonWidgetProps ) {
	return (
		<Stack direction="column" gap="lg" className={ styles.container }>
			<MetricWithComparison
				value={ value }
				previousValue={ comparisonValue }
				dataFormat={ dataFormat }
				direction="row"
				align="flex-end"
			/>

			<ComparativeLineChart
				series={ series }
				styles={ seriesStyles }
				dataFormat={ dataFormat }
				tickFormat={ tickFormat }
			/>
		</Stack>
	);
}
