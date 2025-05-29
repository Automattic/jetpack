import { useMemo } from 'react';
import { getLongestLabelWidth } from './utils';
import type { BaseChartProps, DataPointDate } from '../../types';
import type { XYChartTheme } from '@visx/xychart';

export const useChartMargin = (
	options: BaseChartProps[ 'options' ],
	allDataPoints: DataPointDate[],
	yTickFormatter: ( value: number ) => string,
	theme: XYChartTheme
) => {
	return useMemo( () => {
		// Default margin is for bottom axis labels.
		const defaultMargin = { top: 10, right: 0, bottom: 20, left: 0 };

		// Auto-margin for y axis labels.
		if ( options.axis?.y?.orientation === 'right' ) {
			defaultMargin.right =
				getLongestLabelWidth(
					allDataPoints,
					yTickFormatter,
					theme.axisStyles.y.right.axisLabel ?? {}
				) + theme.axisStyles.y.right.tickLength;
		} else {
			defaultMargin.left =
				getLongestLabelWidth(
					allDataPoints,
					yTickFormatter,
					theme.axisStyles.y.left.axisLabel ?? {}
				) + theme.axisStyles.y.left.tickLength;
		}

		if ( options.axis?.x?.orientation === 'top' ) {
			defaultMargin.top = 20;
			defaultMargin.bottom = 10;
		}

		return defaultMargin;
	}, [ options, allDataPoints, yTickFormatter, theme ] );
};
