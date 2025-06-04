import { formatNumberCompact } from '@automattic/number-formatters';
import { useMemo } from 'react';
import type { DataPointDate, BaseChartProps, SeriesData } from '../../types';
import type { TickFormatter } from '@visx/axis';

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

/**
 * Get the inner padding of a scale.
 *
 * @param scale - The scale to get the inner padding of.
 * @return The inner padding of the scale.
 */
const getInnerPadding = ( scale: Record< string, unknown > ): number => {
	return typeof scale.innerPadding === 'number' ? ( scale.innerPadding as number ) : 0;
};

/**
 * Returns the merged options for the bar chart, including axis and scale configuration based on the orientation.
 *
 * @param data       - The data to be displayed in the chart.
 * @param horizontal - Whether the chart is horizontal or vertical.
 * @param options    - The options for the chart.
 * @return The merged options for the chart.
 */
export function useBarChartOptions(
	data: SeriesData[],
	horizontal: boolean,
	options: BaseChartProps[ 'options' ] = {}
) {
	const defaultOptions = useMemo( () => {
		const bandScale = {
			type: 'band' as const,
			padding: 0.2,
			innerPadding: 0.1,
		};
		const linearScale = {
			type: 'linear' as const,
			nice: true,
			zero: false,
		};

		const labelFormatter = data?.[ 0 ]?.data?.[ 0 ]?.label
			? ( label: string ) => label
			: formatDateTick;
		const valueFormatter = formatNumberCompact as TickFormatter< unknown >;

		const labelAccessor = ( d: DataPointDate ) => d?.label || d?.date;
		const valueAccessor = ( d: DataPointDate ) => d?.value;

		return {
			vertical: {
				xTickFormat: labelFormatter,
				yTickFormat: valueFormatter,
				tooltipLabelFormatter: labelFormatter,
				xAccessor: labelAccessor,
				yAccessor: valueAccessor,
				gridVisibility: 'y',
				xScale: bandScale,
				yScale: linearScale,
			},
			horizontal: {
				xTickFormat: valueFormatter,
				yTickFormat: labelFormatter,
				tooltipLabelFormatter: labelFormatter,
				xAccessor: valueAccessor,
				yAccessor: labelAccessor,
				gridVisibility: 'x',
				xScale: linearScale,
				yScale: bandScale,
			},
		};
	}, [ data ] );

	return useMemo( () => {
		const orientationKey = horizontal ? 'horizontal' : 'vertical';
		const {
			xTickFormat,
			yTickFormat,
			tooltipLabelFormatter: defaultTooltipLabelFormatter,
			xAccessor,
			yAccessor,
			gridVisibility,
			xScale: baseXScale,
			yScale: baseYScale,
		} = defaultOptions[ orientationKey ];

		const xScale = { ...baseXScale, ...( options.xScale || {} ) };
		const yScale = { ...baseYScale, ...( options.yScale || {} ) };
		const providedToolTipLabelFormatter = horizontal
			? options.axis?.y?.tickFormat
			: options.axis?.x?.tickFormat;

		return {
			gridVisibility,
			xScale,
			yScale,
			accessors: {
				xAccessor,
				yAccessor,
			},
			axis: {
				x: {
					orientation: 'bottom' as const,
					numTicks: 4,
					tickFormat: xTickFormat,
					...( options.axis?.x || {} ),
				},
				y: {
					orientation: 'left' as const,
					numTicks: 4,
					tickFormat: yTickFormat,
					...( options.axis?.y || {} ),
				},
			},
			barGroup: {
				padding: getInnerPadding( horizontal ? yScale : xScale ),
			},
			tooltip: {
				labelFormatter: providedToolTipLabelFormatter || defaultTooltipLabelFormatter,
			},
		};
	}, [ defaultOptions, options, horizontal ] );
}
