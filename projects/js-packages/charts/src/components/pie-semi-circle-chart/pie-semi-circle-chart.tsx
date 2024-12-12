import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import Pie, { PieArcDatum } from '@visx/shape/lib/shapes/Pie';
import { Text } from '@visx/text';
import clsx from 'clsx';
import { FC, useState, useCallback } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { BaseTooltip } from '../tooltip';
import styles from './pie-semi-circle-chart.module.scss';
import type { DataPointPercentage } from '../shared/types';

type ArcData = PieArcDatum< DataPointPercentage >;

interface TooltipData {
	label: string;
	value: number;
	valueDisplay: string;
	x: number;
	y: number;
}

interface PieSemiCircleChartProps {
	/**
	 * Array of data points to display in the chart
	 */
	data: DataPointPercentage[];
	/**
	 * Width of the chart in pixels
	 */
	width: number;
	/**
	 * Height of the chart in pixels
	 */
	height: number;
	/**
	 * Label text to display above the chart
	 */
	label: string;
	/**
	 * Note text to display below the label
	 */
	note: string;
	showTooltips?: boolean;
}

const PieSemiCircleChart: FC< PieSemiCircleChartProps > = ( {
	data,
	width,
	height,
	label,
	note,
	showTooltips = false,
} ) => {
	const providerTheme = useChartTheme();
	const [ tooltipData, setTooltipData ] = useState< TooltipData | null >( null );
	const centerX = width / 2;
	const centerY = height;

	const accessors = {
		value: d => d.value,
		sort: ( a, b ) => a.value - b.value,
		fill: d => d.data.color,
	};

	return (
		<div className={ clsx( 'pie-semi-circle-chart', styles[ 'pie-semi-circle-chart' ] ) }>
			<svg width={ width } height={ height }>
				<Group top={ centerY } left={ centerX }>
					<Pie
						data={ data }
						pieValue={ getPieValue }
						outerRadius={ radius }
						innerRadius={ radius * 0.7 }
						cornerRadius={ 3 }
						padAngle={ 0.03 }
						startAngle={ -Math.PI / 2 }
						endAngle={ Math.PI / 2 }
					>
						{ pie => {
							return pie.arcs.map( arc => (
								<g
									key={ arc.data.label }
									onMouseEnter={ handleArcMouseEnter( arc ) }
									onMouseLeave={ handleMouseLeave }
								>
									<path d={ pie.path( arc ) || '' } fill={ arc.data.color } />
								</g>
							) );
						} }
					</Pie>
					<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 18 } y={ radius * 0.5 }>
						{ label }
					</Text>
					<Text
						textAnchor="middle"
						verticalAnchor="middle"
						fill="#008A20"
						fontSize={ 13 }
						y={ radius * 0.65 }
					>
						{ note }
					</Text>
				</Group>
			</svg>

			{ showTooltips && tooltipData && (
				<BaseTooltip
					data={ {
						label: tooltipData.label,
						value: tooltipData.value,
						valueDisplay: tooltipData.valueDisplay,
					} }
					top={ tooltipData.y }
					left={ tooltipData.x }
				/>
			) }
		</div>
	);
};

export default PieSemiCircleChart;
