/**
 * External dependencies
 */
import { RectShape } from '@automattic/charts/visx/legend';
import { Stack } from '@wordpress/ui';
import styles from './chart-tooltip.module.scss';
import { TooltipRow } from './tooltip-row';
import type { DataFormat } from '../../types';
import type { DataPointPercentage } from '@automattic/charts';

/**
 * Internal dependencies
 */

export type PieChartTooltipProps = {
	/**
	 * Tooltip data from pie chart hover — a single DataPointPercentage.
	 */
	tooltipData: DataPointPercentage;

	/**
	 * Format configuration for the value display.
	 */
	dataFormat: DataFormat;
};

/**
 * Tooltip component for pie and semi-circle charts.
 * Renders a single row with a color indicator, label, and formatted value.
 *
 * Reuses the same SCSS module as ChartTooltip so styling (box-shadow, padding,
 * the `:global(.visx-tooltip):has(.tooltip)` override) is shared.
 */
export function PieChartTooltip( { tooltipData, dataFormat }: PieChartTooltipProps ) {
	return (
		<Stack direction="column" className={ styles.tooltip } gap="xs">
			<TooltipRow
				indicator={
					<RectShape fill={ tooltipData.color || 'currentColor' } height={ 8 } width={ 8 } />
				}
				label={ tooltipData.label }
				value={ tooltipData.value }
				dataFormat={ dataFormat }
			/>
		</Stack>
	);
}
