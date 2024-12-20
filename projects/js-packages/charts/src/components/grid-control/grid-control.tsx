import { GridRows, GridColumns } from '@visx/grid';
import { scaleLinear } from '@visx/scale';
import React from 'react';
import type { BaseChartProps } from '../shared/types';

// Define a type for grid visibility options
type GridVisibility = 'x' | 'y' | 'xy' | 'none';

interface GridControlProps extends BaseChartProps {
	xScale: ReturnType< typeof scaleLinear >;
	yScale: ReturnType< typeof scaleLinear >;
	gridVisibility?: GridVisibility;
	top?: number;
}

const GridControl: React.FC< GridControlProps > = ( {
	width,
	height,
	xScale,
	yScale,
	gridVisibility = 'x',
	top = 0,
} ) => {
	return (
		<g transform={ `translate(0, ${ top })` }>
			{ gridVisibility.includes( 'x' ) && <GridColumns scale={ xScale } height={ height } /> }
			{ gridVisibility.includes( 'y' ) && <GridRows scale={ yScale } width={ width } /> }
		</g>
	);
};

export default GridControl;
