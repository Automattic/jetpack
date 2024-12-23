import { GridRows, GridColumns } from '@visx/grid';
import { scaleLinear } from '@visx/scale';
import React from 'react';
import styles from './grid-control.module.scss';
import type { BaseChartProps } from '../shared/types';

interface GridControlProps extends BaseChartProps {
	xScale: ReturnType< typeof scaleLinear >;
	yScale: ReturnType< typeof scaleLinear >;
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
		<g transform={ `translate(0, ${ top })` } className={ styles[ 'grid-control' ] }>
			{ gridVisibility.includes( 'x' ) && <GridRows scale={ xScale } width={ width } /> }
			{ gridVisibility.includes( 'y' ) && <GridColumns scale={ yScale } height={ height } /> }
		</g>
	);
};

export default GridControl;
