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
	const radius = Math.min( width, height ) / 3;

	const accessors = {
		value: d => d.value,
		sort: ( a, b ) => a.value - b.value,
		// Use the color property from the data object as a last resort. The theme provides colours by default.
		fill: d => d.color || providerTheme.colors[ d.index ],
	};

	const handleMouseEnter = useCallback(
		( event: React.MouseEvent, arc: ArcData ) => {
			if ( ! showTooltips ) return;
			const coords = localPoint( event );
			if ( ! coords ) return;

			setTooltipData( {
				label: arc.data.label,
				value: arc.data.value,
				valueDisplay: arc.data.valueDisplay,
				x: coords.x,
				y: coords.y,
			} );
		},
		[ showTooltips ]
	);

	const handleMouseLeave = useCallback( () => setTooltipData( null ), [] );

	const handleArcMouseEnter = useCallback(
		( arc: ArcData ) => ( event: React.MouseEvent ) => {
			handleMouseEnter( event, arc );
		},
		[ handleMouseEnter ]
	);

	return (
		<div className={ clsx( 'pie-semi-circle-chart', styles[ 'pie-semi-circle-chart' ] ) }>
			<svg width={ width } height={ height }>
				<Group top={ centerY } left={ centerX }>
					<Pie< DataPointPercentage >
						data={ data }
						pieValue={ accessors.value }
						outerRadius={ radius }
						innerRadius={ radius * 0.7 }
						cornerRadius={ 3 }
						padAngle={ 0.03 }
						startAngle={ -Math.PI / 2 }
						endAngle={ Math.PI / 2 }
						pieSort={ accessors.sort }
						fill={ accessors.fill }
					>
						{ pie => {
							return pie.arcs.map( arc => (
								<g
									key={ arc.data.label }
									onMouseEnter={ handleArcMouseEnter( arc ) }
									onMouseLeave={ handleMouseLeave }
								>
									<path d={ pie.path( arc ) || '' } fill={ accessors.fill( arc.data ) } />
								</g>
							) );
						} }
					</Pie>
					<Text
						textAnchor="middle"
						verticalAnchor="middle"
						fontSize={ 18 }
						lineHeight={ 20 }
						y={ -36 }
					>
						{ label }
					</Text>
					<Text
						textAnchor="middle"
						verticalAnchor="middle"
						fill="#008A20"
						fontSize="13px"
						lineHeight={ 20 }
						y={ -12 }
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
					} }
					top={ tooltipData.y }
					left={ tooltipData.x }
				/>
			) }
		</div>
	);
};

export default PieSemiCircleChart;
