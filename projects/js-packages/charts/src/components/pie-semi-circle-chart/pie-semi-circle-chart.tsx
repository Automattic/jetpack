import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
import clsx from 'clsx';
import { FC } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import styles from './pie-semi-circle-chart.module.scss';
import type { DataPointPercentage } from '../shared/types';

// TODO: convert hard-coded values to props

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
}

const PieSemiCircleChart: FC< PieSemiCircleChartProps > = ( {
	data,
	width,
	height,
	label,
	note,
} ) => {
	const providerTheme = useChartTheme();
	const centerX = width / 2;
	const centerY = height;

	const accessors = {
		value: d => d.value,
		sort: ( a, b ) => a.value - b.value,
		// Use the color property from the data object as a last resort. The theme provides colours by default.
		fill: d => d.color || providerTheme.colors[ d.index ],
	};

	return (
		<div className={ clsx( 'pie-semi-circle-chart', styles[ 'pie-semi-circle-chart' ] ) }>
			<svg width={ width } height={ height }>
				<Group top={ centerY } left={ centerX }>
					<Pie< DataPointPercentage >
						data={ data }
						pieValue={ accessors.value }
						outerRadius={ 100 }
						innerRadius={ 70 }
						cornerRadius={ 3 }
						padAngle={ 0.03 }
						startAngle={ -Math.PI / 2 }
						endAngle={ Math.PI / 2 }
						pieSort={ accessors.sort }
						fill={ accessors.fill }
					/>
					<Group>
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
				</Group>
			</svg>
		</div>
	);
};

export default PieSemiCircleChart;
