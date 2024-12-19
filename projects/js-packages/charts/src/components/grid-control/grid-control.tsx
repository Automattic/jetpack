import { GridRows, GridColumns } from '@visx/grid';
import { scaleLinear } from '@visx/scale'; // Use visx/scale exclusively
import clsx from 'clsx';
import { FC } from 'react';
import styles from './grid-control.module.scss';
import type { GridVisibility } from '../shared/types';

interface GridControlProps extends GridVisibility {
	width: number;
	height: number;
	xScale: ReturnType< typeof scaleLinear< number > >; // Explicitly type scale output
	yScale: ReturnType< typeof scaleLinear< number > >;
}

/**
 * GridControl component to manage the visibility of grid lines in a chart.
 * @param {GridControlProps} props - Component properties
 * @return {JSX.Element} Rendered GridControl component
 */
const GridControl: FC< GridControlProps > = ( {
	showGridX = true,
	showGridY = true,
	className,
	width,
	height,
	xScale,
	yScale,
} ) => {
	return (
		<g className={ clsx( styles.grid, className || '' ) }>
			{ /* Render Y-axis grid lines if showGridY is true */ }
			{ showGridY && (
				<GridRows
					scale={ yScale }
					width={ width }
					numTicks={ 4 } // Number of ticks for Y-axis grid lines
				/>
			) }
			{ /* Render X-axis grid lines if showGridX is true */ }
			{ showGridX && (
				<GridColumns
					scale={ xScale }
					height={ height }
					numTicks={ 4 } // Number of ticks for X-axis grid lines
				/>
			) }
		</g>
	);
};

export default GridControl;
