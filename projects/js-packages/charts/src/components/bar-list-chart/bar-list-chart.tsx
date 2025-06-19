import { formatNumberCompact } from '@automattic/number-formatters';
import { Group } from '@visx/group';
import { createScale, scaleBand } from '@visx/scale';
import { Text, type TextProps } from '@visx/text';
import { useMemo } from 'react';
import { BarChart } from '../bar-chart';
import { withResponsive } from '../shared/with-responsive';
import type { SeriesData } from '../..';
import type { ScaleOptions } from '../../types';
import type { BarChartProps } from '../bar-chart/bar-chart';
import type { AxisRendererProps, AxisScale } from '@visx/axis';
import type { AnyD3Scale } from '@visx/scale';
import type { ComponentType, FC } from 'react';

interface BarListChartProps
	extends Exclude< BarChartProps, 'orientation' | 'size' | 'gridVisibility' > {
	options?: {
		/**
		 * Scale for the y axis. Exclude the type property.
		 */
		yScale: Omit< ScaleOptions, 'type' >;
		/**
		 * Scale for the x axis. Exclude the type property.
		 */
		xScale: Omit< ScaleOptions, 'type' >;
		/**
		 * Formatter for the label.
		 */
		labelFormatter?: ( value: string ) => string;
		/**
		 * Formatter for the value.
		 */
		valueFormatter?: ( value: number ) => string;
		/**
		 * y offset of the label and value. Default is based on the number of series, automatically computed.
		 */
		yOffset?: number;
		/**
		 * x position of the label.
		 */
		labelPosition?: number;
		/**
		 * x position of the value.
		 */
		valuePosition?: number;
		/**
		 * Custom render function for the label.
		 */
		labelComponent?: ComponentType< RenderLabelProps >;
		/**
		 * Custom render function for the value.
		 */
		valueComponent?: ComponentType< RenderValueProps >;
	};
}

interface RenderLabelProps {
	textProps: TextProps;
	x: number;
	y: number;
	label: string;
	formatter: ( value: string ) => string;
}

interface RenderValueProps {
	textProps: TextProps;
	x: number;
	y: number;
	value: number;
	/**
	 * Original data
	 */
	data: SeriesData[];
	/**
	 * Index of the data point
	 */
	index: number;
	formatter: ( value: number ) => string;
}

/**
 * Get the bandwidth of a scale
 * @param scale - The scale to get the bandwidth of
 * @return The bandwidth of the scale
 */
const getScaleBandwidth = < Scale extends AxisScale >( scale?: Scale ) => {
	// Broaden type before using 'xxx' in s as typeguard.
	const s = scale as AxisScale;
	return s && 'bandwidth' in s ? s?.bandwidth() ?? 0 : 0;
};

const DefaultLabelComponent = ( { textProps, x, y, label, formatter } ) => {
	return (
		<Text { ...textProps } textAnchor="start" x={ x } y={ y }>
			{ formatter( label ) }
		</Text>
	);
};

const DefaultValueComponent = ( { textProps, x, y, value, formatter }: RenderValueProps ) => {
	return (
		<Text { ...textProps } textAnchor="end" x={ x } y={ y } fontWeight={ 500 }>
			{ formatter( value ) }
		</Text>
	);
};

const AxisRenderer = ( {
	ticks,
	tickLabelProps,
	yOffset,
	labelPosition,
	valuePosition,
	data,
	labelFormatter,
	valueFormatter,
	LabelComponent = DefaultLabelComponent,
	ValueComponent = DefaultValueComponent,
}: AxisRendererProps< AnyD3Scale > & {
	yOffset: number;
	labelPosition: number;
	valuePosition: number;
	data: SeriesData[];
	labelFormatter?: ( value: string ) => string;
	valueFormatter?: ( value: number ) => string;
	LabelComponent?: ComponentType< RenderLabelProps >;
	ValueComponent?: ComponentType< RenderValueProps >;
} ) => {
	if ( ticks.length === 0 ) {
		return null;
	}

	// compute the max tick label size to compute label offset
	const allTickLabelProps = ticks.map( ( { value, index } ) =>
		typeof tickLabelProps === 'function' ? tickLabelProps( value, index, ticks ) : {}
	);

	return ticks.map( ( { from, formattedValue }, index ) => {
		const textProps = allTickLabelProps[ index ] ?? {};
		// No need to pass textAnchor and dx. It will be handled by the component.
		delete textProps.textAnchor;
		delete textProps.dx;

		const sum = data.reduce(
			( acc, { data: seriesData } ) => acc + ( seriesData[ index ]?.value ?? 0 ),
			0
		);
		const y = from.y + yOffset;

		return (
			<Group key={ index }>
				<LabelComponent
					textProps={ textProps }
					x={ labelPosition }
					y={ y }
					label={ formattedValue }
					formatter={ labelFormatter }
				/>
				<ValueComponent
					textProps={ textProps }
					x={ valuePosition }
					y={ y }
					value={ sum }
					formatter={ valueFormatter }
					data={ data }
					index={ index }
				/>
			</Group>
		);
	} );
};

/**
 * Calculate the default y offset for the bar list chart.
 * @param data          - The data to calculate the default y offset for.
 * @param yScaleConfig  - The y scale configuration.
 * @param height        - The height of the chart.
 * @param isMultiSeries - Whether the chart is a multi series chart.
 * @return The default y offset.
 */
const getDefaultYOffset = (
	data: SeriesData[],
	yScaleConfig: Omit< ScaleOptions, 'type' >,
	height: number,
	isMultiSeries: boolean
) => {
	if ( ! isMultiSeries ) {
		return 0;
	}

	const dataKeys = data.map( ( { label } ) => label );

	const yScale = createScale< string >( {
		type: 'band' as const,
		range: [ 0, height ],
		domain: dataKeys,
		...yScaleConfig,
	} );

	const groupScale = scaleBand< string >( {
		domain: dataKeys,
		range: [ 0, getScaleBandwidth( yScale ) ],
		padding: yScaleConfig.paddingInner,
	} );

	const GAP_BETWEEN_BARS = 6;
	const barThickness = getScaleBandwidth( groupScale );

	// Use negative value to move the label up.
	return -( barThickness + GAP_BETWEEN_BARS );
};

const BarListChart: FC< BarListChartProps > = ( {
	data,
	width,
	height,
	options = {},
	margin = {
		left: 0,
		right: 20,
		bottom: 0,
		top: 0,
	},
	...rest
} ) => {
	const chartOptions = useMemo( () => {
		const isMultiSeries = data.length > 1;

		const defaultYScale = {
			// For multi series, set default padding larger to look better.
			paddingInner: isMultiSeries ? 0.3 : 0.1,
			padding: isMultiSeries ? 0.3 : 0.1,
		};
		const defaultXScale = {
			// Always begin at zero since the x axis is hidden.
			zero: true,
		};
		const yScale = {
			...defaultYScale,
			...( options.yScale ?? {} ),
		};
		const xScale = {
			...defaultXScale,
			...( options.xScale ?? {} ),
		};

		return {
			yScale,
			xScale,
			labelPosition: options.labelPosition ?? ( isMultiSeries ? 0 : 10 ),
			valueFormatter: options.valueFormatter ?? ( value => formatNumberCompact( value ) ),
			labelFormatter: options.labelFormatter ?? ( value => String( value ) ),
			valuePosition: options.valuePosition ?? width,
			yOffset: options.yOffset ?? getDefaultYOffset( data, yScale, height, isMultiSeries ),
		};
	}, [ options, width, data, height ] );

	return (
		<BarChart
			orientation="horizontal"
			gridVisibility={ 'none' }
			data={ data }
			width={ width }
			height={ height }
			margin={ margin }
			options={ {
				axis: {
					y: {
						children: ( renderProps: AxisRendererProps< AnyD3Scale > ) => (
							<AxisRenderer
								{ ...renderProps }
								data={ data }
								yOffset={ chartOptions.yOffset }
								labelPosition={ chartOptions.labelPosition }
								valuePosition={ chartOptions.valuePosition }
								labelFormatter={ chartOptions.labelFormatter }
								valueFormatter={ chartOptions.valueFormatter }
								LabelComponent={ options.labelComponent }
								ValueComponent={ options.valueComponent }
							/>
						),
					},
					x: {
						children: () => null,
					},
				},
				xScale: chartOptions.xScale,
				yScale: chartOptions.yScale,
			} }
			{ ...rest }
		/>
	);
};

export default withResponsive< BarListChartProps >( BarListChart );
