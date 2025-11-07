import { createScale, getTicks } from '@visx/scale';
import { useMemo } from 'react';
import { getLongestTickWidth } from '../utils';
import type { BaseChartProps, DataPointDate, SeriesData } from '../types';
import type { XYChartTheme } from '@visx/xychart';

export const useChartMargin = (
	height: number,
	options: BaseChartProps[ 'options' ],
	data: SeriesData[],
	theme: XYChartTheme,
	horizontal: boolean = false
) => {
	const yTicks = useMemo( () => {
		const allDataPoints = data.flatMap( series => series.data as DataPointDate[] );

		if ( horizontal ) {
			// When horizontal, y ticks renders fixed tick labels.
			return allDataPoints.map(
				d => d.label || options.axis?.y?.tickFormat( d.date.getTime(), 0, [] )
			);
		}

		const minY = Math.min( ...allDataPoints.map( d => d.value ) );
		const maxY = Math.max( ...allDataPoints.map( d => d.value ) );
		const yScale = createScale( {
			...options.yScale,
			domain: [ minY, maxY ],
			range: [ height, 0 ],
		} );

		return getTicks( yScale, options.axis?.y?.numTicks );
	}, [ options, data, height, horizontal ] );

	return useMemo( () => {
		// Default margin is for bottom axis labels.
		const defaultMargin = { top: 10, right: 20, bottom: 20, left: 20 };
		const defaultTickWidth = 40;

		// Auto-calculate margin for y axis labels based on orientation and tick width.
		const yAxisOrientation = options.axis?.y?.orientation;
		const yAxisStyles =
			yAxisOrientation === 'right' ? theme.axisStyles.y.right : theme.axisStyles.y.left;
		const yTickWidth = getLongestTickWidth(
			yTicks,
			options.axis?.y?.tickFormat,
			yAxisStyles.axisLabel
		);
		const yMarginValue = ( yTickWidth ?? defaultTickWidth ) + ( yAxisStyles?.tickLength ?? 0 );

		if ( yAxisOrientation === 'right' ) {
			defaultMargin.right = yMarginValue;
		} else {
			defaultMargin.left = yMarginValue;
		}

		// Dynamically compute X-axis margin (bottom by default, or top if orientation is 'top').
		// This mirrors Y-axis behavior where margin is based on label size and tick length.
		const xOrientation = options.axis?.x?.orientation || 'bottom';
		// Attempt to read axis label styles from theme; fallback to svgLabelSmall when not defined.
		// XYChartTheme type keeps axisStyles optional, so we need to guard access.
		type AxisStyleLike = { axisLabel?: { fontSize?: number | string }; tickLength?: number };
		type ThemeWithOptionalX = XYChartTheme & {
			axisStyles?: { x?: { top?: AxisStyleLike; bottom?: AxisStyleLike } };
			svgLabelSmall?: { fontSize?: number | string };
			tickLength?: number;
		};
		const themeWithX = theme as ThemeWithOptionalX;
		const xAxisStyles: AxisStyleLike | undefined =
			xOrientation === 'top' ? themeWithX.axisStyles?.x?.top : themeWithX.axisStyles?.x?.bottom;

		// Resolve a numeric font size to approximate label height.
		const resolveFontSize = ( val?: unknown ): number | undefined => {
			if ( typeof val === 'number' && ! isNaN( val ) ) return val;
			if ( typeof val === 'string' ) {
				const parsed = parseFloat( val );
				return isNaN( parsed ) ? undefined : parsed;
			}
			return undefined;
		};

		const labelFontSize =
			resolveFontSize( xAxisStyles?.axisLabel?.fontSize ) ||
			resolveFontSize( themeWithX.svgLabelSmall?.fontSize ) ||
			12;
		const labelLineHeight = Math.round( labelFontSize * 1.25 );
		const xTickLength =
			// Prefer axis-specific tick length when present, else theme fallback
			xAxisStyles?.tickLength ?? themeWithX.tickLength ?? 8;
		const xPadding = 8;
		const computedXMargin = labelLineHeight + xTickLength + xPadding;

		if ( xOrientation === 'top' ) {
			// Preserve a small bottom margin for layout breathing room
			defaultMargin.top = Math.max( defaultMargin.top, computedXMargin );
			defaultMargin.bottom = Math.max( defaultMargin.bottom, 10 );
		} else {
			defaultMargin.bottom = Math.max( defaultMargin.bottom, computedXMargin );
		}

		return defaultMargin;
	}, [ options, theme, yTicks ] );
};
