import { useEffect, useState, useCallback } from 'react';
import LineChartAnnotation from './line-chart-annotation';
import type { LineChartRef } from './line-chart';
import type { LineChartAnnotationProps } from './line-chart-annotation';

interface LineChartAnnotationsProps {
	chartRef: React.RefObject< LineChartRef >;
	annotations: LineChartAnnotationProps[];
	chartWidth: number;
	chartHeight: number;
}

const LineChartAnnotations: React.FC< LineChartAnnotationsProps > = ( {
	chartRef,
	annotations,
	chartWidth,
	chartHeight,
} ) => {
	const [ scales, setScales ] = useState< { xScale: unknown; yScale: unknown } | null >( null );
	const [ isReady, setIsReady ] = useState( false );

	// Get scales from chart ref
	const updateScales = useCallback( () => {
		if ( chartRef.current ) {
			const scaleData = chartRef.current.getScales();
			if ( scaleData ) {
				setScales( scaleData );
				setIsReady( true );
			}
		}
	}, [ chartRef ] );

	// Update scales when component mounts and when chart updates
	useEffect( () => {
		updateScales();

		// Set up a timer to retry getting scales if not immediately available
		const timer = setTimeout( updateScales, 100 );

		return () => clearTimeout( timer );
	}, [ updateScales ] );

	// Don't render anything if scales aren't ready
	if ( ! isReady || ! scales ) {
		return null;
	}

	const { xScale, yScale } = scales;

	// Type guard functions for scales
	const hasRangeMethod = (
		scale: unknown
	): scale is {
		( input: Date | number ): number;
		range: () => number[];
	} => {
		return typeof scale === 'function' && 'range' in scale && typeof scale.range === 'function';
	};

	if ( ! hasRangeMethod( xScale ) || ! hasRangeMethod( yScale ) ) {
		return null;
	}

	// Get chart bounds from scale ranges - these are the bounds for the positioning logic
	const chartBounds = {
		xMin: Math.min( ...xScale.range() ),
		xMax: Math.max( ...xScale.range() ),
		yMin: Math.min( ...yScale.range() ),
		yMax: Math.max( ...yScale.range() ),
	};

	// Calculate positions for each annotation
	const positionedAnnotations = annotations
		.filter( annotation => annotation.datum )
		.map( ( annotation, index ) => {
			const { datum, ...rest } = annotation;
			if ( ! datum ) return null;

			// Get scale coordinates - these are already positioned correctly for the chart
			const chartX = xScale( datum.date );
			const chartY = yScale( datum.value );

			return {
				...rest,
				datum,
				index,
				chartX,
				chartY,
			};
		} )
		.filter( Boolean );

	return (
		<svg
			width={ chartWidth }
			height={ chartHeight }
			style={ {
				position: 'absolute',
				left: 0,
				top: 0,
				overflow: 'visible',
				pointerEvents: 'none',
			} }
		>
			{ positionedAnnotations.map( annotation => {
				if ( ! annotation ) return null;

				return (
					<g
						key={ `overlay-annotation-${ annotation.datum.date?.getTime() }-${
							annotation.datum.value
						}` }
						style={ { pointerEvents: 'auto' } }
					>
						<LineChartAnnotation
							testId={ `overlay-annotation-${ annotation.index }` }
							datum={ annotation.datum }
							// Use the full chart coordinates
							x={ annotation.chartX }
							y={ annotation.chartY }
							// Pass the scale ranges as chart bounds for boundary detection
							chartBounds={ chartBounds }
							{ ...annotation }
						/>
					</g>
				);
			} ) }
		</svg>
	);
};

export default LineChartAnnotations;
