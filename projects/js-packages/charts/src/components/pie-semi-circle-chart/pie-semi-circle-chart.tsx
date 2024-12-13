import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import Pie, { PieArcDatum } from '@visx/shape/lib/shapes/Pie';
import { Text } from '@visx/text';
import { useTooltip } from '@visx/tooltip';
import clsx from 'clsx';
import { FC, useCallback } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { BaseTooltip } from '../tooltip';
import styles from './pie-semi-circle-chart.module.scss';
import type { DataPointPercentage } from '../shared/types';

type ArcData = PieArcDatum< DataPointPercentage >;

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
	/**
	 * Whether to show tooltips
	 */
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
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentage >();

	const centerX = width / 2;
	const centerY = height;
	const radius = Math.min( width, height ) / 3;

	// Map the data to include index for color assignment
	const dataWithIndex = data.map( ( d, index ) => ( {
		...d,
		index,
	} ) );

	const accessors = {
		value: ( d: DataPointPercentage & { index: number } ) => d.value,
		sort: (
			a: DataPointPercentage & { index: number },
			b: DataPointPercentage & { index: number }
		) => b.value - a.value,
		// Use the color property from the data object as a last resort. The theme provides colours by default.
		fill: ( d: DataPointPercentage & { index: number } ) =>
			d.color || providerTheme.colors[ d.index % providerTheme.colors.length ],
	};

	const handleMouseMove = useCallback(
		( event: React.MouseEvent, arc: ArcData ) => {
			const coords = localPoint( event );
			if ( ! coords ) return;

			showTooltip( {
				tooltipData: arc.data,
				tooltipLeft: coords.x,
				tooltipTop: coords.y - 10,
			} );
		},
		[ showTooltip ]
	);

	const handleMouseLeave = useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

	const handleArcMouseMove = useCallback(
		( arc: ArcData ) => ( event: React.MouseEvent ) => {
			handleMouseMove( event, arc );
		},
		[ handleMouseMove ]
	);

	return (
		<div className={ clsx( 'pie-semi-circle-chart', styles[ 'pie-semi-circle-chart' ] ) }>
			<svg width={ width } height={ height }>
				{ /*  chart group */ }
				<Group top={ centerY } left={ centerX }>
					<Pie< DataPointPercentage & { index: number } >
						data={ dataWithIndex }
						pieValue={ accessors.value }
						outerRadius={ radius }
						innerRadius={ radius * 0.7 }
						cornerRadius={ 3 }
						padAngle={ 0.03 }
						startAngle={ -Math.PI / 2 }
						endAngle={ Math.PI / 2 }
						pieSort={ accessors.sort }
					>
						{ pie => {
							return pie.arcs.map( arc => (
								<g
									key={ arc.data.label }
									onMouseMove={ handleArcMouseMove( arc ) }
									onMouseLeave={ handleMouseLeave }
								>
									<path d={ pie.path( arc ) || '' } fill={ accessors.fill( arc.data ) } />
								</g>
							) );
						} }
					</Pie>
				</Group>
				{ /* text elements group */ }
				<Group top={ 40 } left={ centerX }>
					<Text
						textAnchor="middle"
						verticalAnchor="start"
						className={ styles.label }
						style={ { fontFamily: 'inherit' } }
					>
						{ label }
					</Text>
					<Text
						textAnchor="middle"
						verticalAnchor="start"
						y={ height * 0.7 }
						className={ styles.note }
						style={ { fontFamily: 'inherit' } }
					>
						{ note }
					</Text>
				</Group>
			</svg>

			{ showTooltips && tooltipOpen && tooltipData && (
				<BaseTooltip
					data={ {
						label: tooltipData.label,
						value: tooltipData.value,
						valueDisplay: tooltipData.valueDisplay,
					} }
					top={ tooltipTop }
					left={ tooltipLeft }
				/>
			) }
		</div>
	);
};

export default PieSemiCircleChart;
