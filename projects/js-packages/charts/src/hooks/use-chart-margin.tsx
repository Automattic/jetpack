import { createScale, getTicks } from '@visx/scale';
import { useMemo } from 'react';
import { getLongestTickWidth, resolveFontSize } from '../utils';
import type { BaseChartProps, DataPointDate, SeriesData } from '../types';
import type { XYChartTheme } from '@visx/xychart';

/**
 * Base top margin used when no dynamic adjustments are necessary.
 */
const DEFAULT_MARGIN_TOP = 10;

/**
 * Base right margin used when no dynamic adjustments are necessary.
 */
const DEFAULT_MARGIN_RIGHT = 20;

/**
 * Base bottom margin used for charts with a bottom X-axis.
 * This is large enough for typical font sizes and will be increased
 * dynamically when tick labels require more space.
 */
const DEFAULT_MARGIN_BOTTOM = 20;

/**
 * Base left margin used when no dynamic adjustments are necessary.
 */
const DEFAULT_MARGIN_LEFT = 20;

/**
 * Bottom margin to use when the X-axis is rendered at the top.
 * We only need a small buffer below the chart in that case.
 */
const DEFAULT_BOTTOM_FOR_TOP_AXIS = 10;

/**
 * Fallback font size used when we cannot derive a font size
 * from the theme or axis styles for X-axis tick labels.
 */
const DEFAULT_FONT_SIZE = 12;

/**
 * Fallback tick length used when tickLength is not provided
 * by the theme for either axis.
 */
const DEFAULT_TICK_LENGTH = 8;

/**
 * Fallback width used for Y-axis tick labels when we cannot
 * measure them via getLongestTickWidth.
 */
const DEFAULT_Y_TICK_WIDTH = 40;

const getXAxisLabelMetrics = ( theme: XYChartTheme, orientation: 'top' | 'bottom' ) => {
	const xAxisStyles =
		orientation === 'top' ? theme.axisStyles?.x?.top : theme.axisStyles?.x?.bottom;

	const fontSize =
		resolveFontSize( xAxisStyles?.axisLabel?.fontSize ) ||
		resolveFontSize( theme.svgLabelSmall?.fontSize ) ||
		DEFAULT_FONT_SIZE;

	const tickLength = xAxisStyles?.tickLength ?? DEFAULT_TICK_LENGTH;

	return { fontSize, tickLength };
};

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

		if ( options.axis?.y?.tickValues?.length ) {
			return options.axis.y.tickValues;
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
		const defaultMargin = {
			top: DEFAULT_MARGIN_TOP,
			right: DEFAULT_MARGIN_RIGHT,
			bottom: DEFAULT_MARGIN_BOTTOM,
			left: DEFAULT_MARGIN_LEFT,
		};

		// Auto-calculate margin for y axis labels based on orientation and tick width.
		const yAxisOrientation = options.axis?.y?.orientation;
		const yAxisStyles =
			yAxisOrientation === 'right' ? theme.axisStyles.y.right : theme.axisStyles.y.left;
		const yTickWidth = getLongestTickWidth(
			yTicks,
			options.axis?.y?.tickFormat,
			yAxisStyles.axisLabel
		);
		// visx's default axis theme pushes y-axis tick labels a further 0.25em
		// away from the axis (dx of -0.25em on the left, 0.25em on the right), so
		// reserve that on top of the measured label width — without it the widest
		// label clips at the SVG edge. The em resolves against the tick label's own
		// font size (theme tickLabel), not the axis-title font size (axisLabel).
		const yTickLabelFontSize =
			resolveFontSize( yAxisStyles?.tickLabel?.fontSize ) || DEFAULT_FONT_SIZE;
		const yMarginValue =
			( yTickWidth ?? DEFAULT_Y_TICK_WIDTH ) +
			( yAxisStyles?.tickLength ?? 0 ) +
			Math.ceil( yTickLabelFontSize * 0.25 );

		if ( yAxisOrientation === 'right' ) {
			defaultMargin.right = yMarginValue;
		} else {
			defaultMargin.left = yMarginValue;
		}

		// Dynamically compute X-axis margin (bottom by default, or top if orientation is 'top').
		// This mirrors Y-axis behavior where margin is based on label size and tick length,
		// but keeps the padding minimal so consumers can control container spacing themselves.
		const xOrientation = options.axis?.x?.orientation === 'top' ? 'top' : 'bottom';
		const { fontSize, tickLength } = getXAxisLabelMetrics( theme, xOrientation );
		const computedXMargin = fontSize + tickLength;

		if ( xOrientation === 'top' ) {
			defaultMargin.top = Math.max( defaultMargin.top, computedXMargin );
			defaultMargin.bottom = DEFAULT_BOTTOM_FOR_TOP_AXIS;
		} else {
			defaultMargin.bottom = Math.max( defaultMargin.bottom, computedXMargin );
		}

		return defaultMargin;
	}, [ options, theme, yTicks ] );
};
