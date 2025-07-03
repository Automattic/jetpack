import { DataContext } from '@visx/xychart';
import { useEffect, useState, useCallback } from 'react';
import LineChartAnnotation from './line-chart-annotation';
import styles from './line-chart.module.scss';
import type { LineChartRef } from './line-chart';
import type { LineChartAnnotationProps } from './line-chart-annotation';
import type { AxisScale } from '@visx/axis';

interface LineChartAnnotationsProps {
	chartRef: React.RefObject< LineChartRef >;
	annotations: LineChartAnnotationProps[];
	chartWidth: number;
	chartHeight: number;
}

interface ScaleData {
	xScale: AxisScale< Date >;
	yScale: AxisScale< number >;
}

const LineChartAnnotations: React.FC< LineChartAnnotationsProps > = ( {
	chartRef,
	annotations,
	chartWidth,
	chartHeight,
} ) => {
	const [ scales, setScales ] = useState< ScaleData | null >( null );

	// Create a signature for scale data to enable easy comparison
	const createScaleSignature = useCallback( ( scaleData: ScaleData ) => {
		const xDomain = scaleData.xScale.domain();
		const yDomain = scaleData.yScale.domain();
		const xRange = scaleData.xScale.range();
		const yRange = scaleData.yScale.range();

		return `${ xDomain.join( ',' ) }-${ yDomain.join( ',' ) }-${ xRange.join(
			','
		) }-${ yRange.join( ',' ) }`;
	}, [] );

	// Get scales from chart ref and return them with signature for comparison
	const getScalesData = useCallback( () => {
		if ( chartRef.current ) {
			const scaleData = chartRef.current.getScales();

			if ( scaleData ) {
				const scaleInfo = {
					xScale: scaleData.xScale as AxisScale< Date >,
					yScale: scaleData.yScale as AxisScale< number >,
				};

				return {
					scales: scaleInfo,
					signature: createScaleSignature( scaleInfo ),
				};
			}
		}

		return null;
	}, [ chartRef, createScaleSignature ] );

	// The chart resizes on render so we need to monitor the scales until they stabilize
	useEffect( () => {
		let timeoutId: number | null = null;
		let lastSignature: string | null = null;
		let retryCount = 0;
		const maxRetries = 20; // 20 * 50ms = 1 second max
		const checkInterval = 50; // Check every 50ms

		const monitorScales = () => {
			const currentScaleData = getScalesData();

			// If we got scales, compare signatures
			if ( currentScaleData ) {
				// Check if scales have settled by comparing signatures
				const scalesSettled = lastSignature && currentScaleData.signature === lastSignature;

				if ( scalesSettled ) {
					return;
				}

				// Update scales and remember signature for next comparison
				setScales( currentScaleData.scales );
				lastSignature = currentScaleData.signature;
			}

			// Continue monitoring if we haven't exceeded max retries
			if ( retryCount < maxRetries ) {
				retryCount++;
				timeoutId = setTimeout( monitorScales, checkInterval ) as unknown as number;
			}
		};

		monitorScales();

		return () => {
			if ( timeoutId ) {
				clearTimeout( timeoutId );
			}
		};
	}, [ getScalesData, chartWidth, chartHeight ] );

	if ( ! scales ) {
		return null;
	}

	// Create a DataContext value that mimics what visx provides
	// We're intentionally providing minimal context for annotations to work
	const dataContextValue = {
		xScale: scales.xScale,
		yScale: scales.yScale,
		// Add minimal required properties for DataContext
		theme: {},
		margin: { top: 0, right: 0, bottom: 0, left: 0 },
		width: chartWidth,
		height: chartHeight,
		// Additional visx DataContext properties that may be needed
		colorScale: undefined,
		dataRegistry: new Map(),
		registerData: () => {},
		unregisterData: () => {},
	} as unknown as Parameters< typeof DataContext.Provider >[ 0 ][ 'value' ];

	return (
		<DataContext.Provider value={ dataContextValue }>
			<svg
				width={ chartWidth }
				height={ chartHeight }
				className={ styles[ 'line-chart__annotations-overlay' ] }
			>
				{ annotations.map( ( annotation, index ) => (
					<LineChartAnnotation
						key={ `overlay-annotation-${ index }` }
						testId={ `overlay-annotation-${ index }` }
						datum={ annotation.datum }
						title={ annotation.title }
						subtitle={ annotation.subtitle }
						subjectType={ annotation.subjectType }
						styles={ annotation.styles }
						dx={ annotation.dx }
						dy={ annotation.dy }
						renderLabel={ annotation.renderLabel }
					/>
				) ) }
			</svg>
		</DataContext.Provider>
	);
};

export default LineChartAnnotations;
