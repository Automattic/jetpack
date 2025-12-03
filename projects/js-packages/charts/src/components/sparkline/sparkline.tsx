import { curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { buildChartTheme, XYChart, LineSeries, AreaSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useMemo, forwardRef, useCallback } from 'react';
import { GlobalChartsProvider, useGlobalChartsTheme, useChartId } from '../../providers';
import { withResponsive } from '../private/with-responsive';
import styles from './sparkline.module.scss';
import type { SparklineProps, GradientConfig } from './types';

const DEFAULT_WIDTH = 100;
const DEFAULT_HEIGHT = 40;
const DEFAULT_MARGIN = { top: 2, right: 2, bottom: 2, left: 2 };
const DEFAULT_STROKE_WIDTH = 1;
const DEFAULT_WITH_GRADIENT_FILL = true;
const DEFAULT_GRADIENT_FROM_OPACITY = 0.5;
const DEFAULT_GRADIENT_TO_OPACITY = 0.0;

type ChartDataPoint = {
	x: number;
	y: number;
};

const SparklineComponent = forwardRef< HTMLDivElement | SVGSVGElement, SparklineProps >(
	(
		{
			data,
			width = DEFAULT_WIDTH,
			height = DEFAULT_HEIGHT,
			color,
			strokeWidth = DEFAULT_STROKE_WIDTH,
			withGradientFill = DEFAULT_WITH_GRADIENT_FILL,
			gradient,
			className,
			chartId: providedChartId,
			margin = DEFAULT_MARGIN,
		},
		ref
	) => {
		const theme = useGlobalChartsTheme();
		const generatedChartId = useChartId();
		const chartId = providedChartId || generatedChartId;

		// Determine line color (use prop or default to first theme color)
		const lineColor = useMemo( () => {
			return color || theme?.colors?.[ 0 ] || '#000000';
		}, [ color, theme ] );

		// Transform data from number[] to {x, y}[] format for visx
		const chartData = useMemo< ChartDataPoint[] >( () => {
			return ( data || [] ).map( ( value, index ) => ( {
				x: index,
				y: value,
			} ) );
		}, [ data ] );

		// Compute gradient configuration
		const gradientConfig = useMemo< Required< GradientConfig > >( () => {
			const defaultFrom = lineColor;
			const defaultTo = theme?.backgroundColor || '#ffffff';

			return {
				from: gradient?.from || defaultFrom,
				to: gradient?.to || defaultTo,
				fromOpacity: gradient?.fromOpacity ?? DEFAULT_GRADIENT_FROM_OPACITY,
				toOpacity: gradient?.toOpacity ?? DEFAULT_GRADIENT_TO_OPACITY,
			};
		}, [ lineColor, gradient, theme ] );

		// Build visx theme
		const xychartTheme = useMemo( () => {
			return buildChartTheme( {
				...theme,
				colors: [ lineColor, ...( theme?.colors ?? [] ) ],
			} );
		}, [ theme, lineColor ] );

		// Merge margins
		const finalMargin = useMemo( () => {
			return {
				...DEFAULT_MARGIN,
				...margin,
			};
		}, [ margin ] );

		// Generate unique gradient ID
		const gradientId = `sparkline-gradient-${ chartId }`;

		// Create accessor functions
		const xAccessor = useCallback( ( d: ChartDataPoint ) => d.x, [] );
		const yAccessor = useCallback( ( d: ChartDataPoint ) => d.y, [] );

		// Handle edge cases
		if ( ! data || data.length === 0 ) {
			return (
				<div
					ref={ ref as React.Ref< HTMLDivElement > }
					className={ clsx( styles.sparkline, styles[ 'sparkline--empty' ], className ) }
					style={ { width, height } }
					data-testid="sparkline-empty"
				/>
			);
		}

		// Single point: render a circle
		if ( data.length === 1 ) {
			const cx = width / 2;
			const cy = height / 2;

			return (
				<svg
					ref={ ref as React.Ref< SVGSVGElement > }
					width={ width }
					height={ height }
					className={ clsx( styles.sparkline, styles[ 'sparkline--single-point' ], className ) }
					data-testid="sparkline-single-point"
				>
					<circle cx={ cx } cy={ cy } r={ strokeWidth * 1.5 } fill={ lineColor } />
				</svg>
			);
		}

		// Full sparkline with line and optional gradient
		return (
			<div
				ref={ ref as React.Ref< HTMLDivElement > }
				className={ clsx( styles.sparkline, className ) }
				data-testid="sparkline"
			>
				<XYChart
					theme={ xychartTheme }
					width={ width }
					height={ height }
					margin={ finalMargin }
					xScale={ { type: 'linear' } }
					yScale={ { type: 'linear', nice: true, zero: false } }
					captureEvents={ false }
				>
					{ withGradientFill && (
						<LinearGradient
							id={ gradientId }
							from={ gradientConfig.from }
							to={ gradientConfig.to }
							fromOpacity={ gradientConfig.fromOpacity }
							toOpacity={ gradientConfig.toOpacity }
							vertical
						/>
					) }

					{ withGradientFill && (
						<AreaSeries
							dataKey="sparkline-area"
							data={ chartData }
							xAccessor={ xAccessor }
							yAccessor={ yAccessor }
							fill={ `url(#${ gradientId })` }
							renderLine={ false }
							curve={ curveMonotoneX }
						/>
					) }

					<LineSeries
						dataKey="sparkline-line"
						data={ chartData }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						stroke={ lineColor }
						strokeWidth={ strokeWidth }
						curve={ curveMonotoneX }
					/>
				</XYChart>
			</div>
		);
	}
);

SparklineComponent.displayName = 'SparklineComponent';

/**
 * Sparkline chart component with GlobalChartsProvider wrapper
 */
const SparklineUnresponsive = forwardRef< HTMLDivElement | SVGSVGElement, SparklineProps >(
	( props, ref ) => {
		return (
			<GlobalChartsProvider>
				<SparklineComponent { ...props } ref={ ref } />
			</GlobalChartsProvider>
		);
	}
);

SparklineUnresponsive.displayName = 'SparklineUnresponsive';

/**
 * Responsive Sparkline chart component
 */
const Sparkline = withResponsive< SparklineProps >( SparklineUnresponsive );

export { Sparkline as default, SparklineUnresponsive };
