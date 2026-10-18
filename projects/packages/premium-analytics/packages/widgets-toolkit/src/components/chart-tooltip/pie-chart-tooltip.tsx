/**
 * External dependencies
 */
import { RectShape, Stack, type DataPointPercentage } from '@jetpack-premium-analytics/externals';
import { TooltipRow } from './tooltip-row';
import type { DataFormat } from '../../types';

/**
 * Internal dependencies
 */

export type PieChartTooltipProps = {
	/**
	 * Tooltip data from pie chart hover — a single DataPointPercentage.
	 */
	tooltipData: DataPointPercentage;

	dataFormat: DataFormat;
};

/**
 * Tooltip component for pie and semi-circle charts.
 * Renders a single row with a color indicator, label, and formatted value.
 */
export function PieChartTooltip( { tooltipData, dataFormat }: PieChartTooltipProps ) {
	return (
		<Stack direction="column" gap="xs">
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
