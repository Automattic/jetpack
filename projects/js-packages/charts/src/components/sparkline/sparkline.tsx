import clsx from 'clsx';
import { useMemo, forwardRef } from 'react';
import { LineChartUnresponsive } from '../line-chart';
import { withResponsive } from '../private/with-responsive';
import styles from './sparkline.module.scss';
import type { SparklineProps } from './types';
import type { SeriesData } from '../../types';

const DEFAULT_WIDTH = 100;
const DEFAULT_HEIGHT = 40;
const DEFAULT_MARGIN = { top: 2, right: 2, bottom: 2, left: 2 };
const DEFAULT_STROKE_WIDTH = 1.5;

/**
 * Transforms a simple number array into SeriesData format for LineChart.
 * Uses index-based dates to create a linear x-axis.
 *
 * @param data        - Array of numeric values to plot
 * @param color       - Optional color for the line stroke
 * @param strokeWidth - Optional stroke width for the line
 * @return SeriesData array suitable for LineChart
 */
const transformToSeriesData = (
	data: number[],
	color?: string,
	strokeWidth?: number
): SeriesData[] => {
	// Use a fixed base date and increment by index to create linear spacing
	const baseDate = new Date( 2000, 0, 1 );

	return [
		{
			label: 'sparkline',
			data: data.map( ( value, index ) => ( {
				date: new Date( baseDate.getTime() + index * 86400000 ), // Add days
				value,
			} ) ),
			options: {
				stroke: color,
				seriesLineStyle: strokeWidth ? { strokeWidth } : undefined,
			},
		},
	];
};

const SparklineComponent = forwardRef< HTMLDivElement, SparklineProps >(
	(
		{
			data,
			width = DEFAULT_WIDTH,
			height = DEFAULT_HEIGHT,
			color,
			strokeWidth = DEFAULT_STROKE_WIDTH,
			withGradientFill = true,
			gradient,
			className,
			chartId,
			margin = DEFAULT_MARGIN,
		},
		ref
	) => {
		// Transform number[] to SeriesData[] for LineChart
		const seriesData = useMemo( () => {
			if ( ! data || data.length === 0 ) {
				return [];
			}
			return transformToSeriesData( data, color, strokeWidth );
		}, [ data, color, strokeWidth ] );

		// Merge margins
		const finalMargin = useMemo( () => {
			return {
				...DEFAULT_MARGIN,
				...margin,
			};
		}, [ margin ] );

		// Build gradient options for the series if custom gradient is provided
		// Note: This must be called before any early returns to follow React hooks rules
		const seriesWithGradient = useMemo( () => {
			if ( ! gradient || seriesData.length === 0 ) {
				return seriesData;
			}

			return seriesData.map( series => ( {
				...series,
				options: {
					...series.options,
					gradient: {
						from: gradient.from || color || '#000000',
						to: gradient.to || '#ffffff',
						fromOpacity: gradient.fromOpacity ?? 0.5,
						toOpacity: gradient.toOpacity ?? 0.0,
					},
				},
			} ) );
		}, [ seriesData, gradient, color ] );

		// Handle empty data
		if ( ! data || data.length === 0 ) {
			return (
				<div
					ref={ ref }
					className={ clsx( styles.sparkline, styles[ 'sparkline--empty' ], className ) }
					style={ { width, height } }
					data-testid="sparkline-empty"
				/>
			);
		}

		// Handle single data point - render a simple dot
		if ( data.length === 1 ) {
			const cx = width / 2;
			const cy = height / 2;
			const resolvedColor = color || '#000000';

			return (
				<svg
					width={ width }
					height={ height }
					className={ clsx( styles.sparkline, styles[ 'sparkline--single-point' ], className ) }
					data-testid="sparkline-single-point"
				>
					<circle cx={ cx } cy={ cy } r={ strokeWidth * 1.5 } fill={ resolvedColor } />
				</svg>
			);
		}

		return (
			<div ref={ ref } className={ clsx( styles.sparkline, className ) } data-testid="sparkline">
				<LineChartUnresponsive
					data={ seriesWithGradient }
					width={ width }
					height={ height }
					margin={ finalMargin }
					chartId={ chartId }
					withGradientFill={ withGradientFill }
					withTooltips={ false }
					showLegend={ false }
					gridVisibility="none"
					options={ {
						axis: {
							x: { display: false },
							y: { display: false },
						},
					} }
					curveType="monotone"
				/>
			</div>
		);
	}
);

SparklineComponent.displayName = 'SparklineComponent';

/**
 * Sparkline - A minimal line chart for inline data visualization.
 *
 * Sparklines are compact charts designed to be embedded inline with text or
 * displayed in small spaces like table cells or dashboards. They show trends
 * without axes, labels, or other chart chrome.
 *
 * This component is built on top of LineChart with preconfigured settings
 * for minimal display (no axes, grid, tooltips, or legend).
 */
const SparklineUnresponsive = SparklineComponent;

SparklineUnresponsive.displayName = 'SparklineUnresponsive';

/**
 * Responsive Sparkline chart component
 */
const Sparkline = withResponsive< SparklineProps >( SparklineUnresponsive );

export { Sparkline as default, SparklineUnresponsive };
